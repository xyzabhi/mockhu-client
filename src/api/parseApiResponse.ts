import { AppError } from './AppError';
import type { ApiEnvelope, ApiErrorBody } from './types';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isRawAuthMiddlewareBody(body: unknown): body is { message: string } {
  if (!isRecord(body)) return false;
  if ('success' in body) return false;
  return typeof body.message === 'string';
}

function isFailureEnvelope(body: unknown): body is { success: false; error: ApiErrorBody } {
  if (!isRecord(body) || body.success !== false) return false;
  const err = body.error;
  if (!isRecord(err)) return false;
  return typeof err.message === 'string';
}

function isSuccessEnvelope(body: unknown): body is { success: true; data: unknown } {
  return isRecord(body) && body.success === true && 'data' in body;
}

/**
 * Parse JSON API responses: envelope success/failure, plus unwrapped 401 middleware bodies.
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const status = response.status;
  let body: unknown;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw AppError.fromHttpStatus(
      status,
      status >= 500 ? 'Invalid server response.' : 'Invalid response.',
    );
  }

  if (status === 401 && isRawAuthMiddlewareBody(body)) {
    throw AppError.reauth(body.message);
  }

  if (isFailureEnvelope(body)) {
    throw AppError.fromApiError(body.error, status);
  }

  if (isSuccessEnvelope(body)) {
    return body.data as T;
  }

  if (!response.ok) {
    if (isRecord(body) && typeof body.message === 'string') {
      throw new AppError(body.message, status >= 500 ? 'retry' : 'user', undefined, status);
    }
    throw AppError.fromHttpStatus(status);
  }

  throw new AppError('Unexpected response shape', 'retry', undefined, status);
}

/** Narrow type guard for envelope (optional tooling). */
export function isApiEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return isSuccessEnvelope(body) || isFailureEnvelope(body);
}
