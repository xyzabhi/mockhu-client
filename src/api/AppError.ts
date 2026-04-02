import type { ApiErrorBody, ApiErrorCode } from './types';

export type AppErrorKind = 'user' | 'retry' | 'reauth';

/**
 * Normalized client error: use `kind` for UX (toast vs retry vs send to login).
 */
export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly code?: ApiErrorCode;
  readonly status?: number;

  constructor(
    message: string,
    kind: AppErrorKind,
    code?: ApiErrorCode,
    status?: number,
  ) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.code = code;
    this.status = status;
  }

  static reauth(message = 'Session expired. Please sign in again.'): AppError {
    return new AppError(message, 'reauth', 'UNAUTHORIZED', 401);
  }

  static fromApiError(error: ApiErrorBody, httpStatus: number): AppError {
    const kind = mapCodeToKind(error.code, httpStatus);
    return new AppError(error.message || 'Something went wrong', kind, error.code, httpStatus);
  }

  static fromHttpStatus(status: number, fallbackMessage?: string): AppError {
    const message =
      fallbackMessage ||
      (status >= 500
        ? 'Server error. Please try again.'
        : 'Request failed. Please try again.');
    const kind: AppErrorKind = status >= 500 ? 'retry' : 'user';
    return new AppError(message, kind, undefined, status);
  }
}

function mapCodeToKind(code: ApiErrorCode, status: number): AppErrorKind {
  if (code === 'UNAUTHORIZED' || status === 401) return 'reauth';
  if (code === 'INTERNAL_ERROR' || status >= 500) return 'retry';
  return 'user';
}
