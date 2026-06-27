/**
 * Base Error Class
 * All custom errors should inherit from this to maintain consistent error handling
 */
export class ApiError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 * Used when the client sends invalid data or parameters
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details = null) {
    super(message, 'BAD_REQUEST', 400, details);
  }
}

/**
 * Unauthorized Error (401)
 * Used when authentication is required and has failed or not been provided
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', details = null) {
    super(message, 'UNAUTHORIZED', 401, details);
  }
}

/**
 * Forbidden Error (403)
 * Used when the user is authenticated but doesn't have permission
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', details = null) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource is not found
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Conflict Error (409)
 * Used when there's a conflict with the current state of the resource
 */
export class ConflictError extends ApiError {
  constructor(message = 'Conflict', details = null) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Validation Error (422)
 * Used when input validation fails
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation error', details = null) {
    super(message, 'VALIDATION_ERROR', 422, details);
  }
}

/**
 * Internal Server Error (500)
 * Used when an unexpected error occurs on the server
 */
export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details = null) {
    super(message, 'INTERNAL_ERROR', 500, details);
  }
}

/**
 * Service Unavailable Error (503)
 * Used when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message = 'Service unavailable', details = null) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}
