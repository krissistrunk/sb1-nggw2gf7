/**
 * Application Error Types
 * Centralized error handling for consistent error messages and types
 */

// Base application error
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message: string, code = 'AUTH_ERROR', context?: Record<string, unknown>) {
    super(message, code, 401, true, context);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = 'You must be logged in to perform this action') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN', 403, true);
  }
}

export class SessionExpiredError extends AuthError {
  constructor(message = 'Your session has expired. Please log in again.') {
    super(message, 'SESSION_EXPIRED');
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message, 'VALIDATION_ERROR', 400, true, { fields });
    this.fields = fields;
  }
}

export class InvalidInputError extends ValidationError {
  constructor(field: string, message: string) {
    super(`Invalid ${field}: ${message}`, { [field]: message });
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID "${id}" was not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, true, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, true, context);
  }
}

export class DuplicateError extends ConflictError {
  constructor(resource: string, field: string, value: string) {
    super(`A ${resource} with ${field} "${value}" already exists`, {
      resource,
      field,
      value,
    });
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500, true, {
      originalMessage: originalError?.message,
    });
  }
}

export class QueryError extends DatabaseError {
  constructor(operation: string, table: string, originalError?: Error) {
    super(`Failed to ${operation} ${table}`, originalError);
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true, {
      service,
      originalMessage: originalError?.message,
    });
  }
}

export class AIServiceError extends ExternalServiceError {
  constructor(message: string, originalError?: Error) {
    super('AI Service', message, originalError);
  }
}

export class SupabaseError extends ExternalServiceError {
  constructor(message: string, originalError?: Error) {
    super('Supabase', message, originalError);
  }
}

// Organization errors
export class OrganizationError extends AppError {
  constructor(message: string, code = 'ORGANIZATION_ERROR') {
    super(message, code, 400, true);
  }
}

export class OrganizationRequiredError extends OrganizationError {
  constructor() {
    super(
      'Organization context is required. Please complete organization setup.',
      'ORGANIZATION_REQUIRED'
    );
  }
}

export class OrganizationNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super('Organization', id);
  }
}

// Rate limiting
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super(
      `Too many requests. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true,
      { retryAfter }
    );
    this.retryAfter = retryAfter;
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(message = 'Network error. Please check your connection.') {
    super(message, 'NETWORK_ERROR', 0, true);
  }
}

export class TimeoutError extends NetworkError {
  constructor(operation: string) {
    super(`The ${operation} operation timed out. Please try again.`);
  }
}

// Utility functions
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

// Error factory for Supabase errors
export function fromSupabaseError(error: { message: string; code?: string }): AppError {
  const message = error.message;
  const code = error.code || '';

  // Map common Supabase error codes
  if (code === 'PGRST116' || message.includes('not found')) {
    return new NotFoundError('Resource');
  }
  if (code === '23505' || message.includes('duplicate')) {
    return new DuplicateError('Resource', 'value', 'unknown');
  }
  if (code === '42501' || message.includes('permission denied')) {
    return new ForbiddenError();
  }
  if (message.includes('JWT') || message.includes('token')) {
    return new SessionExpiredError();
  }

  return new SupabaseError(message);
}

// Error handler for async functions
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => AppError
): Promise<[T, null] | [null, AppError]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const appError = errorHandler
      ? errorHandler(error)
      : isAppError(error)
      ? error
      : new AppError(getErrorMessage(error), 'UNKNOWN_ERROR');
    return [null, appError];
  }
}
