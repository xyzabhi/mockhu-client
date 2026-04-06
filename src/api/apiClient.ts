import { AppError } from './AppError';
import { getApiV1Url } from './config';
import { devNetworkDelay } from './devNetworkDelay';
import { parseApiResponse } from './parseApiResponse';
import { refreshTokens } from './refreshCoordinator';
import { notifyReauthRequired } from './reauth';
import * as sessionStore from './sessionStore';

const AUTH_PREFIX = '/auth/';

export type ApiRequestInit = RequestInit & {
  /** Do not attach Bearer (used for auth endpoints). */
  skipAuth?: boolean;
};

function isAuthPath(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith(AUTH_PREFIX) || p === '/auth' || p.startsWith('/auth?');
}

function joinUrl(path: string): string {
  const base = getApiV1Url();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function attachAuthHeaders(
  headers: Headers,
  skipAuth: boolean | undefined,
  path: string,
): Promise<void> {
  if (skipAuth || isAuthPath(path)) return;
  const token = await sessionStore.getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
}

/**
 * Single HTTP entry for `/api/v1/*`: JSON, unwrap envelope, 401 → refresh once → retry.
 */
export async function apiClient<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init;

  const headers = new Headers(initHeaders as HeadersInit | undefined);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (rest.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  await attachAuthHeaders(headers, skipAuth, path);

  const url = joinUrl(path);
  await devNetworkDelay();
  let response = await fetch(url, { ...rest, headers });

  const shouldTryRefresh =
    response.status === 401 && !skipAuth && !isAuthPath(path);

  if (shouldTryRefresh) {
    const hasRefresh = (await sessionStore.getRefreshToken()) != null;
    if (!hasRefresh) {
      await sessionStore.clearSession();
      notifyReauthRequired();
      throw AppError.reauth();
    }
    try {
      await refreshTokens();
    } catch {
      throw AppError.reauth();
    }
    const retryHeaders = new Headers(initHeaders as HeadersInit | undefined);
    if (!retryHeaders.has('Accept')) {
      retryHeaders.set('Accept', 'application/json');
    }
    if (rest.body != null && !retryHeaders.has('Content-Type')) {
      retryHeaders.set('Content-Type', 'application/json');
    }
    await attachAuthHeaders(retryHeaders, skipAuth, path);
    await devNetworkDelay();
    response = await fetch(url, { ...rest, headers: retryHeaders });
  }

  if (response.status === 401 && !isAuthPath(path) && !skipAuth) {
    await sessionStore.clearSession();
    notifyReauthRequired();
    throw AppError.reauth();
  }

  return parseApiResponse<T>(response);
}

export async function apiGet<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiClient<T>(path, { ...init, method: 'GET' });
}

export async function apiPost<T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> {
  return apiClient<T>(path, {
    ...init,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiPatch<T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> {
  return apiClient<T>(path, {
    ...init,
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiPut<T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> {
  return apiClient<T>(path, {
    ...init,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiClient<T>(path, { ...init, method: 'DELETE' });
}

/**
 * `POST` with `multipart/form-data`. Do not set `Content-Type` — the runtime adds the boundary.
 * Auth + 401 refresh/retry behavior matches `apiClient`.
 */
export async function apiPostMultipart<T>(
  path: string,
  formData: FormData,
  init?: Omit<ApiRequestInit, 'body' | 'method'>,
): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init ?? {};

  const headers = new Headers(initHeaders as HeadersInit | undefined);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  await attachAuthHeaders(headers, skipAuth, path);

  const url = joinUrl(path);
  await devNetworkDelay();
  let response = await fetch(url, { ...rest, method: 'POST', body: formData, headers });

  const shouldTryRefresh =
    response.status === 401 && !skipAuth && !isAuthPath(path);

  if (shouldTryRefresh) {
    const hasRefresh = (await sessionStore.getRefreshToken()) != null;
    if (!hasRefresh) {
      await sessionStore.clearSession();
      notifyReauthRequired();
      throw AppError.reauth();
    }
    try {
      await refreshTokens();
    } catch {
      throw AppError.reauth();
    }
    const retryHeaders = new Headers(initHeaders as HeadersInit | undefined);
    if (!retryHeaders.has('Accept')) {
      retryHeaders.set('Accept', 'application/json');
    }
    await attachAuthHeaders(retryHeaders, skipAuth, path);
    await devNetworkDelay();
    response = await fetch(url, { ...rest, method: 'POST', body: formData, headers: retryHeaders });
  }

  if (response.status === 401 && !isAuthPath(path) && !skipAuth) {
    await sessionStore.clearSession();
    notifyReauthRequired();
    throw AppError.reauth();
  }

  return parseApiResponse<T>(response);
}
