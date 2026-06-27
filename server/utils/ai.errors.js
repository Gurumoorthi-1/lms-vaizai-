/**
 * Structured AI Service Error Classes
 *
 * Use these for typed error handling across the AI service layer.
 * Controllers can catch and map these to appropriate HTTP responses
 * without embedding any business knowledge.
 */

/**
 * Base class for all AI Service errors.
 * Always includes an error code for machine-readable discrimination.
 */
export class AIServiceError extends Error {
  constructor(message, code = 'AI_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when the OpenAI API returns an authentication or authorization error.
 * Maps to HTTP 503 (service unavailable) — not 401, to avoid leaking key info.
 */
export class AIAuthError extends AIServiceError {
  constructor(message = 'AI service authentication failed. Please check the API key configuration.') {
    super(message, 'AI_AUTH_ERROR', 503);
  }
}

/**
 * Thrown when the request is malformed or invalid (e.g., missing prompt).
 * Maps to HTTP 400.
 */
export class AIValidationError extends AIServiceError {
  constructor(message, details = null) {
    super(message, 'AI_VALIDATION_ERROR', 400, details);
  }
}

/**
 * Thrown when the AI response does not match the expected schema.
 * Maps to HTTP 422 (Unprocessable Entity).
 */
export class AIResponseValidationError extends AIServiceError {
  constructor(message, details = null) {
    super(message, 'AI_RESPONSE_INVALID', 422, details);
  }
}

/**
 * Thrown when all retry attempts are exhausted.
 * Maps to HTTP 503 (service unavailable).
 */
export class AIRetryExhaustedError extends AIServiceError {
  constructor(lastError, attempts) {
    super(
      `AI request failed after ${attempts} attempts. Last error: ${lastError?.message || 'Unknown error'}`,
      'AI_RETRY_EXHAUSTED',
      503,
      { attempts, originalError: lastError?.message }
    );
  }
}

/**
 * Thrown when an AI request times out.
 * Maps to HTTP 504 (Gateway Timeout).
 */
export class AITimeoutError extends AIServiceError {
  constructor(timeoutMs) {
    super(
      `AI request timed out after ${timeoutMs}ms.`,
      'AI_TIMEOUT',
      504,
      { timeoutMs }
    );
  }
}

/**
 * Thrown when the OpenAI API returns a rate limit error (429).
 * Maps to HTTP 429 to signal back-off to the client.
 */
export class AIRateLimitError extends AIServiceError {
  constructor(retryAfterMs = null) {
    super(
      'AI service rate limit exceeded. Please try again later.',
      'AI_RATE_LIMIT',
      429,
      { retryAfterMs }
    );
  }
}

/**
 * Thrown when cache operations fail in a way that blocks the request.
 * Generally non-fatal (cache is optional), but surfaced when critical.
 * Maps to HTTP 500.
 */
export class AICacheError extends AIServiceError {
  constructor(operation, message) {
    super(
      `AI cache ${operation} failed: ${message}`,
      'AI_CACHE_ERROR',
      500,
      { operation }
    );
  }
}

/**
 * Thrown when the requested AI model is not supported or configured.
 * Maps to HTTP 400.
 */
export class AIModelNotSupportedError extends AIServiceError {
  constructor(model) {
    super(
      `AI model "${model}" is not supported or configured.`,
      'AI_MODEL_NOT_SUPPORTED',
      400,
      { model }
    );
  }
}
