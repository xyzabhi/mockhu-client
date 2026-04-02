import { getHealthUrl } from './config';
import { devNetworkDelay } from './devNetworkDelay';
import { AppError } from './AppError';

/**
 * GET {BASE_URL}/health — not under /api/v1, no success envelope.
 */
export async function getHealth(): Promise<{ message: string }> {
  const url = getHealthUrl();
  await devNetworkDelay();
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new AppError('Health check returned invalid JSON', 'retry', undefined, res.status);
  }
  if (!res.ok) {
    throw AppError.fromHttpStatus(res.status);
  }
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof (body as { message: unknown }).message === 'string'
  ) {
    return { message: (body as { message: string }).message };
  }
  throw new AppError('Unexpected health response', 'retry', undefined, res.status);
}
