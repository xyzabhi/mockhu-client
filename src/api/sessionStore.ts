import type { TokenResponse, TokenUser } from './types';
import { stringStorage } from './storage/stringStorage';

const K = {
  ACCESS: 'mockhu_access_token',
  REFRESH: 'mockhu_refresh_token',
  EXPIRES_AT: 'mockhu_access_expires_at_ms',
  USER: 'mockhu_user_json',
} as const;

export type SessionSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAtMs: number | null;
  user: TokenUser | null;
};

let snapshot: SessionSnapshot = {
  accessToken: null,
  refreshToken: null,
  accessExpiresAtMs: null,
  user: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function getSessionSnapshot(): SessionSnapshot {
  return snapshot;
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSnapshot(next: SessionSnapshot) {
  snapshot = next;
  emit();
}

/**
 * Persist tokens + user from a TokenResponse. Replaces both tokens (rotation).
 */
export async function saveTokenResponse(tokens: TokenResponse): Promise<void> {
  const accessExpiresAtMs = Date.now() + Math.max(0, tokens.expires_in) * 1000;
  await stringStorage.setItem(K.ACCESS, tokens.access_token);
  await stringStorage.setItem(K.REFRESH, tokens.refresh_token);
  await stringStorage.setItem(K.EXPIRES_AT, String(accessExpiresAtMs));
  await stringStorage.setItem(K.USER, JSON.stringify(tokens.user));
  setSnapshot({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessExpiresAtMs,
    user: tokens.user,
  });
}

export async function loadPersistedSession(): Promise<SessionSnapshot> {
  const [access, refresh, exp, userJson] = await Promise.all([
    stringStorage.getItem(K.ACCESS),
    stringStorage.getItem(K.REFRESH),
    stringStorage.getItem(K.EXPIRES_AT),
    stringStorage.getItem(K.USER),
  ]);
  let user: TokenUser | null = null;
  if (userJson) {
    try {
      const parsed = JSON.parse(userJson) as TokenUser;
      if (parsed && typeof parsed.id === 'string' && typeof parsed.is_onboarded === 'boolean') {
        user = parsed;
      }
    } catch {
      /* ignore */
    }
  }
  const accessExpiresAtMs = exp != null ? Number(exp) : null;
  const next: SessionSnapshot = {
    accessToken: access,
    refreshToken: refresh,
    accessExpiresAtMs: Number.isFinite(accessExpiresAtMs as number) ? accessExpiresAtMs : null,
    user,
  };
  setSnapshot(next);
  return next;
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    stringStorage.removeItem(K.ACCESS),
    stringStorage.removeItem(K.REFRESH),
    stringStorage.removeItem(K.EXPIRES_AT),
    stringStorage.removeItem(K.USER),
  ]);
  setSnapshot({
    accessToken: null,
    refreshToken: null,
    accessExpiresAtMs: null,
    user: null,
  });
}

/** True if access token is missing or past expiry (with leeway). */
export function isAccessTokenExpired(leewaySeconds = 60): boolean {
  const { accessToken, accessExpiresAtMs } = snapshot;
  if (!accessToken || accessExpiresAtMs == null) return true;
  return Date.now() >= accessExpiresAtMs - leewaySeconds * 1000;
}

export async function getAccessToken(): Promise<string | null> {
  return snapshot.accessToken ?? (await stringStorage.getItem(K.ACCESS));
}

export async function getRefreshToken(): Promise<string | null> {
  return snapshot.refreshToken ?? (await stringStorage.getItem(K.REFRESH));
}
