/**
 * AI Controller — Transport Layer Only
 *
 * Responsibilities:
 *  - Parse HTTP request parameters
 *  - Forward to aiService (no business logic here)
 *  - Format HTTP response / SSE stream
 *  - Map typed AIServiceError → correct HTTP status codes
 *
 * Zero business logic. All AI decisions live in ai.service.js.
 */

import { aiService } from '../service/ai.service.js';
import { AIServiceError } from '../utils/ai.errors.js';
import { z } from 'zod';

// ─── Zod Response Schemas (validation contracts, not business logic) ──────────

const quizResponseZodSchema = z.object({
  quiz: z.array(
    z.object({
      question:      z.string(),
      options:       z.array(z.string()).min(4).max(4),
      correctOption: z.string()
    })
  )
});

const flashcardsResponseZodSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string(),
      back:  z.string()
    })
  )
});

// ─── Error Response Helper ────────────────────────────────────────────────────

/**
 * Converts a typed AIServiceError (or generic Error) into an HTTP response.
 */
const sendError = (res, error) => {
  if (error instanceof AIServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      code:    error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {})
    });
  }
  // Untyped / unexpected errors
  console.error('[AIController] Unexpected error:', error);
  return res.status(500).json({
    success: false,
    code:    'AI_INTERNAL_ERROR',
    message: 'An unexpected error occurred in the AI service.'
  });
};

// ─── Streaming Transport Helper ───────────────────────────────────────────────

/**
 * Handles the SSE handshake, writes chunks, and closes the stream.
 * Delegates all content generation to the service action function.
 *
 * @param {Request}  req
 * @param {Response} res
 * @param {Function} actionFn  - (writeChunk: fn) => Promise<any>
 */
const handleAiRequest = async (req, res, actionFn) => {
  const isStreaming = req.query.stream === 'true';

  if (isStreaming) {
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
    res.flushHeaders();

    const writeChunk = (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    };

    try {
      await actionFn(writeChunk);
      res.write('data: [DONE]\n\n');
    } catch (error) {
      const err = error instanceof AIServiceError ? error : { code: 'AI_STREAM_ERROR', message: error.message };
      res.write(`data: ${JSON.stringify({ error: err.code, message: err.message })}\n\n`);
    } finally {
      res.end();
    }
  } else {
    try {
      const result = await actionFn(null);
      res.json({ success: true, result });
    } catch (error) {
      sendError(res, error);
    }
  }
};

// ─── Route Handlers ───────────────────────────────────────────────────────────

export const generateSummary = (req, res) => {
  const { content } = req.body;
  return handleAiRequest(req, res, (writeChunk) =>
    aiService.generateSummary(req.user._id, content, writeChunk)
  );
};

export const generateQuiz = (req, res) => {
  const { topic, difficulty, numQuestions } = req.body;
  return handleAiRequest(req, res, (writeChunk) =>
    aiService.generateQuiz(req.user._id, topic, difficulty, numQuestions, writeChunk, quizResponseZodSchema)
  );
};

export const generateFlashcards = (req, res) => {
  const { topic, numCards } = req.body;
  return handleAiRequest(req, res, (writeChunk) =>
    aiService.generateFlashcards(req.user._id, topic, numCards, writeChunk, flashcardsResponseZodSchema)
  );
};

export const generateInterviewQuestions = (req, res) => {
  const { role, level } = req.body;
  return handleAiRequest(req, res, (writeChunk) =>
    aiService.generateInterviewQuestions(req.user._id, role, level, writeChunk)
  );
};

export const generateAssignment = (req, res) => {
  const { topic, level } = req.body;
  return handleAiRequest(req, res, (writeChunk) =>
    aiService.generateAssignment(req.user._id, topic, level, writeChunk)
  );
};

export const generateRoadmap = (req, res) => {
  const { skill } = req.body;
  return handleAiRequest(req, res, (writeChunk) =>
    aiService.generateRoadmap(req.user._id, skill, writeChunk)
  );
};

export const generateChat = (req, res) => {
  const { message } = req.body;
  return handleAiRequest(req, res, (writeChunk) =>
    aiService.generateChat(req.user._id, message, writeChunk)
  );
};

// ─── History & Stats Handlers ─────────────────────────────────────────────────

export const getHistory = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit || '50', 10);
    const history = await aiService.getHistory(req.user._id, limit);
    res.json({ success: true, history });
  } catch (error) {
    sendError(res, error);
  }
};

export const getUsageStats = async (req, res) => {
  try {
    const stats = await aiService.getUsageStats(req.user._id);
    res.json({ success: true, stats });
  } catch (error) {
    sendError(res, error);
  }
};

// ─── Cache Management Handlers (Admin only) ───────────────────────────────────

export const invalidateCacheByAction = async (req, res) => {
  try {
    const { actionType } = req.params;
    const deleted = await aiService.invalidateCacheByAction(actionType);
    res.json({ success: true, message: `Invalidated ${deleted} cache entries for "${actionType}".` });
  } catch (error) {
    sendError(res, error);
  }
};

export const flushAllCache = async (req, res) => {
  try {
    const deleted = await aiService.flushAllCache();
    res.json({ success: true, message: `Flushed ${deleted} AI cache entries.` });
  } catch (error) {
    sendError(res, error);
  }
};

// ─── Config Handler ───────────────────────────────────────────────────────────

export const getServiceConfig = (_req, res) => {
  res.json({ success: true, config: aiService.getConfig() });
};
