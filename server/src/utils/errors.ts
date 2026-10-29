export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export interface ErrorDetail {
  path?: string;
  message: string;
}

/**
 * Every non-2xx response in this API is shaped
 * { error: { code, message, details? } } — an additive extension, since the
 * OpenAPI contract defines no error schema.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  toBody(): { error: { code: ErrorCode; message: string; details?: ErrorDetail[] } } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && this.details.length > 0 ? { details: this.details } : {}),
      },
    };
  }
}

export const notFound = (message = 'Resource not found'): AppError =>
  new AppError('NOT_FOUND', message);

export const unauthorized = (message = 'Authentication required'): AppError =>
  new AppError('UNAUTHORIZED', message);

export const validationError = (message: string, details?: ErrorDetail[]): AppError =>
  new AppError('VALIDATION_ERROR', message, details);
