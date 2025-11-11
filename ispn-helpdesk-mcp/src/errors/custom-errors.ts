/**
 * Custom Error Classes for ISPN Helpdesk MCP Server
 *
 * These errors provide structured error handling across the application,
 * enabling proper HTTP status codes and error responses.
 */

/**
 * ValidationError - Thrown when input validation fails
 * Returns: 400 Bad Request
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * AuthenticationError - Thrown when authentication fails
 * Returns: 401 Unauthorized or 403 Forbidden
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * RateLimitError - Thrown when rate limit is exceeded
 * Returns: 429 Too Many Requests
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * HelpdeskError - Thrown when helpdesk API operations fail
 * Returns: Variable status code based on helpdesk response
 */
export class HelpdeskError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'HelpdeskError';
    this.statusCode = statusCode || 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * IdempotencyError - Thrown when idempotency check fails
 * Contains the original response to return to client
 * Returns: 200 OK (with cached response)
 */
export class IdempotencyError extends Error {
  constructor(message: string, public originalResponse?: any) {
    super(message);
    this.name = 'IdempotencyError';
    Error.captureStackTrace(this, this.constructor);
  }
}
