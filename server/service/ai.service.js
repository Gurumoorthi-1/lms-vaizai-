/**
 * AI Service — Production-Ready
 *
 * Features:
 *  - Prompt Templates (via /prompts/templates.js)
 *  - Exponential Backoff Retry Logic (configurable via ENV)
 *  - Per-request Timeout (via OpenAI SDK native timeout)
 *  - Token Usage Tracking (prompt + completion + total)
 *  - Multi-model Cost Tracking (rate table from ENV, falls back to defaults)
 *  - Zod Response Validation (schema passed per-call)
 *  - SSE Streaming Support (real stream + simulated cache stream)
 *  - Redis Cache (gracefully degrades if Redis is unavailable)
 *  - Cache Invalidation (per action-type or full namespace flush)
 *  - Structured Error Classes (ai.errors.js)
 *  - Zero Business Logic — pure service layer
 */

import OpenAI from 'openai';
import crypto from 'crypto';
import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { aiRepository } from '../repository/ai.repository.js';
import * as templates from '../prompts/templates.js';
import dotenv from 'dotenv';
import {
  AIAuthError,
  AIRetryExhaustedError,
  AITimeoutError,
  AIRateLimitError,
  AIResponseValidationError,
  AIModelNotSupportedError,
  AIServiceError
} from '../utils/ai.errors.js';

dotenv.config();

// ─── OpenRouter Client ───────────────────────────────────────────────────────────

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

// ─── Config from Environment ─────────────────────────────────────────────────

const DEFAULT_MODEL  = process.env.OPENROUTER_MODEL   || 'openai/gpt-4o-mini';
const MAX_RETRIES    = parseInt(process.env.OPENAI_MAX_RETRIES  || '3',     10);
const TIMEOUT_MS     = parseInt(process.env.OPENAI_TIMEOUT_MS  || '30000', 10);
const CACHE_TTL      = parseInt(process.env.AI_CACHE_TTL       || '86400', 10); // 24h
const CACHE_NS       = 'ai_cache';

// ─── Multi-model Cost Table (USD per 1k tokens) ──────────────────────────────
// Override any value via environment variable. Format: OPENROUTER_COST_<MODEL_KEY>_INPUT_1K
// Model keys use underscores in env vars: gpt-4o → GPT_4O
const MODEL_COSTS = {
  'gpt-4o':                  { input: 0.005,   output: 0.015   },
  'gpt-4o-mini':             { input: 0.00015, output: 0.0006  },
  'gpt-4-turbo':             { input: 0.01,    output: 0.03    },
  'gpt-4':                   { input: 0.03,    output: 0.06    },
  'gpt-3.5-turbo':           { input: 0.0005,  output: 0.0015  },
  'gpt-3.5-turbo-instruct':  { input: 0.0015,  output: 0.002   },
  'meta-llama/llama-3.1-8b-instruct:free': { input: 0.00015, output: 0.0006  },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.0007, output: 0.006 },
  'openai/gpt-3.5-turbo': { input: 0.0005,  output: 0.0015  },
  'openai/gpt-4o': { input: 0.005,   output: 0.015   },
  'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006  },
};

// Allow env overrides for any model (e.g. OPENROUTER_COST_INPUT_1K / OPENROUTER_COST_OUTPUT_1K
// for the default model, or dynamic per-model from the table above)
const getModelRates = (model) => {
  const rates = MODEL_COSTS[model] || MODEL_COSTS[DEFAULT_MODEL] || { input: 0.0005, output: 0.0015 };
  return {
    input:  parseFloat(process.env.OPENROUTER_COST_INPUT_1K  || rates.input),
    output: parseFloat(process.env.OPENROUTER_COST_OUTPUT_1K || rates.output)
  };
};

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Calculate cost of a completion in USD.
 */
const calculateCost = (promptTokens, completionTokens, model) => {
  const { input, output } = getModelRates(model);
  return parseFloat(((promptTokens / 1000) * input + (completionTokens / 1000) * output).toFixed(6));
};

/**
 * Rough token count fallback — 1 token ≈ 4 chars.
 */
const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Build a deterministic Redis cache key.
 */
const buildCacheKey = (actionType, prompt, model) => {
  const hash = crypto.createHash('sha256').update(`${prompt}:${model}`).digest('hex');
  return `${CACHE_NS}:${actionType}:${hash}`;
};

/**
 * Sleep helper used in retry backoff and simulated streaming.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Map raw OpenAI SDK error to a typed AIServiceError.
 */
const mapOpenAIError = (error, attemptsMade) => {
  if (error instanceof AIServiceError) return error; // already typed

  if (error.status === 401 || error.status === 403) {
    return new AIAuthError();
  }
  if (error.status === 429) {
    const retryAfter = error.headers?.['retry-after'];
    return new AIRateLimitError(retryAfter ? parseInt(retryAfter, 10) * 1000 : null);
  }
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new AITimeoutError(TIMEOUT_MS);
  }
  if (attemptsMade >= MAX_RETRIES) {
    return new AIRetryExhaustedError(error, attemptsMade);
  }
  return error; // let caller handle
};

/**
 * Execute fn with exponential back-off retry. Throws a typed error on exhaustion.
 */
const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = 1000, attempt = 0) => {
  try {
    return await fn();
  } catch (error) {
    const typed = mapOpenAIError(error, attempt);

    // Do not retry auth, validation, rate-limit, or already-typed terminal errors
    if (
      typed instanceof AIAuthError ||
      typed instanceof AIRateLimitError ||
      typed instanceof AIRetryExhaustedError ||
      error.status === 400 // bad request — no point retrying
    ) {
      throw typed;
    }

    if (retries <= 0) {
      throw new AIRetryExhaustedError(error, attempt);
    }

    const jitter = Math.random() * 200; // add jitter to avoid thundering herd
    console.warn(
      `[AIService] Request failed (attempt ${attempt + 1}/${MAX_RETRIES}). ` +
      `Retrying in ${Math.round(delay + jitter)}ms. Error: ${error.message}`
    );
    await sleep(delay + jitter);
    return retryWithBackoff(fn, retries - 1, delay * 2, attempt + 1);
  }
};

// ─── Safe Redis Cache Wrapper ─────────────────────────────────────────────────
// Never crashes the request if Redis is down — degrades gracefully.

const safeCache = {
  get: async (key) => {
    try {
      const client = getRedisClient();
      if (isRedisConnected() && client?.isOpen) return await client.get(key);
    } catch (err) {
      console.error('[AIService] Redis GET error:', err.message);
    }
    return null;
  },

  setEx: async (key, ttl, value) => {
    try {
      const client = getRedisClient();
      if (isRedisConnected() && client?.isOpen) await client.setEx(key, ttl, value);
    } catch (err) {
      console.error('[AIService] Redis SETEX error:', err.message);
    }
  },

  del: async (key) => {
    try {
      const client = getRedisClient();
      if (isRedisConnected() && client?.isOpen) return await client.del(key);
    } catch (err) {
      console.error('[AIService] Redis DEL error:', err.message);
    }
    return 0;
  },

  /**
   * Delete all keys matching a glob pattern (namespace flush).
   * Uses SCAN to avoid blocking Redis.
   */
  flushPattern: async (pattern) => {
    try {
      const client = getRedisClient();
      if (!isRedisConnected() || !client?.isOpen) return 0;
      let cursor = 0;
      let deleted = 0;
      do {
        const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = reply.cursor;
        if (reply.keys.length > 0) {
          await client.del(reply.keys);
          deleted += reply.keys.length;
        }
      } while (cursor !== 0);
      return deleted;
    } catch (err) {
      console.error('[AIService] Redis SCAN/DEL error:', err.message);
      return 0;
    }
  }
};

// ─── Simulated Streaming (cache hit path) ────────────────────────────────────

/**
 * Replay a cached text string as if it were a live stream.
 */
const simulateStream = async (text, writeChunk) => {
  const CHUNK_SIZE = 20;
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    writeChunk(text.slice(i, i + CHUNK_SIZE));
    await sleep(10);
  }
};

// ─── Core Execution Engines ───────────────────────────────────────────────────

/**
 * Execute a standard (non-streaming) AI completion.
 *
 * @param {string}   userId      - Authenticated user ID for history tracking
 * @param {string}   actionType  - Label stored in DB (e.g. 'Summary', 'Quiz')
 * @param {string}   prompt      - The full rendered prompt string
 * @param {object}   [options]   - Execution options
 * @param {string}   [options.format='text']         - 'text' | 'json'
 * @param {string}   [options.model]                  - OpenAI model override
 * @param {object}   [options.schema]                 - Zod schema for response validation
 * @param {number}   [options.temperature=0.7]
 * @param {boolean}  [options.bypassCache=false]      - Skip Redis cache lookup
 * @returns {Promise<string|object>} Parsed response
 */
const executePrompt = async (userId, actionType, prompt, options = {}) => {
  const {
    format      = 'text',
    model       = DEFAULT_MODEL,
    schema      = null,
    temperature = 0.7,
    bypassCache = false,
  } = options;

  const cacheKey = buildCacheKey(actionType, prompt, model);

  // ── 1. Cache Lookup ──
  if (!bypassCache) {
    const cached = await safeCache.get(cacheKey);
    if (cached) {
      console.info(`[AIService] Cache HIT: ${cacheKey.slice(0, 60)}`);
      if (format === 'json') {
        try { return JSON.parse(cached); } catch { /* corrupted — refetch */ }
      } else {
        return cached;
      }
    }
  }

  // ── 2. API Call with Retry ──
  const apiCall = () =>
    openai.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: format === 'json' ? { type: 'json_object' } : { type: 'text' },
        temperature,
      },
      { timeout: TIMEOUT_MS }
    );

  const response = await retryWithBackoff(apiCall);

  const content          = response.choices[0].message.content;
  const promptTokens     = response.usage?.prompt_tokens     || estimateTokens(prompt);
  const completionTokens = response.usage?.completion_tokens || estimateTokens(content);
  const totalTokens      = response.usage?.total_tokens      || (promptTokens + completionTokens);
  const cost             = calculateCost(promptTokens, completionTokens, model);

  // ── 3. Schema Validation ──
  let parsedContent = content;
  if (format === 'json') {
    try {
      parsedContent = JSON.parse(content);
    } catch (err) {
      throw new AIResponseValidationError(
        `AI returned malformed JSON: ${err.message}`,
        { rawContent: content.slice(0, 200) }
      );
    }

    if (schema) {
      const result = schema.safeParse(parsedContent);
      if (!result.success) {
        throw new AIResponseValidationError(
          'AI response did not match expected schema.',
          result.error.format()
        );
      }
    }
  }

  // ── 4. Persist to DB (fire-and-forget, non-blocking) ──
  aiRepository.createHistory({
    userId,
    actionType,
    promptContent:     prompt,
    responseContent:   content,
    promptTokens,
    completionTokens,
    tokensUsed:        totalTokens,
    cost,
    modelUsed:         model
  }).catch((err) => console.error('[AIService] Failed to persist prompt history:', err.message));

  // ── 5. Store in Cache ──
  await safeCache.setEx(cacheKey, CACHE_TTL, content);

  return parsedContent;
};

/**
 * Execute a streaming AI completion.
 * Writes SSE-compatible chunks via writeChunk callback.
 * Cache hits are replayed as simulated streams.
 *
 * @param {string}   userId      - Authenticated user ID
 * @param {string}   actionType  - Label for DB history
 * @param {string}   prompt      - Rendered prompt string
 * @param {Function} writeChunk  - Callback receiving each text chunk
 * @param {object}   [options]   - model, temperature, bypassCache
 * @returns {Promise<string>} Full assembled response text
 */
const executeStream = async (userId, actionType, prompt, writeChunk, options = {}) => {
  const {
    model       = DEFAULT_MODEL,
    temperature = 0.7,
    bypassCache = false,
  } = options;

  const cacheKey = buildCacheKey(actionType, prompt, model);

  // ── 1. Cache Lookup → Simulated Stream ──
  if (!bypassCache) {
    const cached = await safeCache.get(cacheKey);
    if (cached) {
      console.info(`[AIService] Stream Cache HIT: ${cacheKey.slice(0, 60)}`);
      await simulateStream(cached, writeChunk);
      return cached;
    }
  }

  // ── 2. Live Stream from OpenAI ──
  const apiCall = () =>
    openai.chat.completions.create(
      {
        model,
        messages:       [{ role: 'user', content: prompt }],
        stream:         true,
        stream_options: { include_usage: true },
        temperature,
      },
      { timeout: TIMEOUT_MS }
    );

  const stream = await retryWithBackoff(apiCall);

  let fullText        = '';
  let promptTokens    = estimateTokens(prompt);
  let completionTokens = 0;
  let totalTokens     = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullText += delta;
      writeChunk(delta);
    }

    // Final usage chunk from stream_options
    if (chunk.usage) {
      promptTokens     = chunk.usage.prompt_tokens;
      completionTokens = chunk.usage.completion_tokens;
      totalTokens      = chunk.usage.total_tokens;
    }
  }

  // Fallback estimates if API did not return usage in stream
  if (totalTokens === 0) {
    completionTokens = estimateTokens(fullText);
    totalTokens      = promptTokens + completionTokens;
  }

  const cost = calculateCost(promptTokens, completionTokens, model);

  // ── 3. Persist to DB (background) ──
  aiRepository.createHistory({
    userId,
    actionType,
    promptContent:   prompt,
    responseContent: fullText,
    promptTokens,
    completionTokens,
    tokensUsed:      totalTokens,
    cost,
    modelUsed:       model
  }).catch((err) => console.error('[AIService] Failed to persist stream history:', err.message));

  // ── 4. Cache full response ──
  await safeCache.setEx(cacheKey, CACHE_TTL, fullText);

  return fullText;
};

// ─── Public Service Interface ─────────────────────────────────────────────────

export const aiService = {

  // ── Content Generation Methods ──

  /**
   * Generate a course/content summary.
   * Supports streaming via optional writeChunk callback.
   */
  generateSummary: async (userId, content, writeChunk = null, options = {}) => {
    const prompt = templates.generateSummaryTemplate(content);
    const opts   = { format: 'text', ...options };
    if (writeChunk) return executeStream(userId, 'Summary', prompt, writeChunk, opts);
    return executePrompt(userId, 'Summary', prompt, opts);
  },

  /**
   * Generate a multiple-choice quiz.
   * Returns { quiz: [...] } or the raw array.
   */
  generateQuiz: async (userId, topic, difficulty, numQuestions, writeChunk = null, schema = null, options = {}) => {
    const basePrompt    = templates.generateQuizTemplate(topic, difficulty, numQuestions);
    const prompt        = `${basePrompt}\nReturn the array wrapped in an object like { "quiz": [...] }`;
    const opts          = { format: 'json', schema, ...options };
    if (writeChunk) return executeStream(userId, 'Quiz', prompt, writeChunk, opts);
    const result = await executePrompt(userId, 'Quiz', prompt, opts);
    return result.quiz || result;
  },

  /**
   * Generate flashcards.
   * Returns { flashcards: [...] } or the raw array.
   */
  generateFlashcards: async (userId, topic, numCards, writeChunk = null, schema = null, options = {}) => {
    const basePrompt = templates.generateFlashcardsTemplate(topic, numCards);
    const prompt     = `${basePrompt}\nReturn the array wrapped in an object like { "flashcards": [...] }`;
    const opts       = { format: 'json', schema, ...options };
    if (writeChunk) return executeStream(userId, 'Flashcards', prompt, writeChunk, opts);
    const result = await executePrompt(userId, 'Flashcards', prompt, opts);
    return result.flashcards || result;
  },

  /**
   * Generate interview questions.
   */
  generateInterviewQuestions: async (userId, role, level, writeChunk = null, options = {}) => {
    const prompt = templates.generateInterviewQuestionsTemplate(role, level);
    const opts   = { format: 'text', ...options };
    if (writeChunk) return executeStream(userId, 'InterviewQuestions', prompt, writeChunk, opts);
    return executePrompt(userId, 'InterviewQuestions', prompt, opts);
  },

  /**
   * Generate an assignment.
   */
  generateAssignment: async (userId, topic, level, writeChunk = null, options = {}) => {
    const prompt = templates.generateAssignmentTemplate(topic, level);
    const opts   = { format: 'text', ...options };
    if (writeChunk) return executeStream(userId, 'Assignment', prompt, writeChunk, opts);
    return executePrompt(userId, 'Assignment', prompt, opts);
  },

  /**
   * Generate a learning roadmap.
   */
  generateRoadmap: async (userId, skill, writeChunk = null, options = {}) => {
    const prompt = templates.generateRoadmapTemplate(skill);
    const opts   = { format: 'text', ...options };
    if (writeChunk) return executeStream(userId, 'Roadmap', prompt, writeChunk, opts);
    return executePrompt(userId, 'Roadmap', prompt, opts);
  },

  /**
   * General chat for AI Mentor.
   */
  generateChat: async (userId, message, writeChunk = null, options = {}) => {
    const prompt = templates.generateChatTemplate(message);
    const opts   = { format: 'text', ...options };
    if (writeChunk) return executeStream(userId, 'Chat', prompt, writeChunk, opts);
    return executePrompt(userId, 'Chat', prompt, opts);
  },

  // ── Cache Management ──

  /**
   * Invalidate the cache for a specific action type (e.g. 'Quiz', 'Summary').
   * Returns the number of keys deleted.
   */
  invalidateCacheByAction: async (actionType) => {
    const pattern = `${CACHE_NS}:${actionType}:*`;
    const deleted = await safeCache.flushPattern(pattern);
    console.info(`[AIService] Cache invalidated: ${deleted} keys for action "${actionType}"`);
    return deleted;
  },

  /**
   * Flush the entire AI response cache namespace.
   * Use with caution — affects all users.
   */
  flushAllCache: async () => {
    const deleted = await safeCache.flushPattern(`${CACHE_NS}:*`);
    console.info(`[AIService] Full cache flush: ${deleted} keys deleted`);
    return deleted;
  },

  // ── Usage & Analytics ──

  /**
   * Return prompt history for a specific user.
   * Delegates to the repository — no DB logic here.
   */
  getHistory: async (userId, limit = 50) => {
    return aiRepository.getHistoryByUser(userId, limit);
  },

  /**
   * Return aggregated usage stats for a user (total tokens, cost, call count).
   * Delegates to the repository.
   */
  getUsageStats: async (userId) => {
    return aiRepository.getUsageStatsByUser(userId);
  },

  // ── Service Metadata ──

  /**
   * Return current service configuration (safe, no secrets).
   */
  getConfig: () => ({
    defaultModel:  DEFAULT_MODEL,
    maxRetries:    MAX_RETRIES,
    timeoutMs:     TIMEOUT_MS,
    cacheTtlSecs:  CACHE_TTL,
    supportedModels: Object.keys(MODEL_COSTS),
  }),
};
