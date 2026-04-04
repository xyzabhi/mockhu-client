import { normalizeTokenUserProfile } from './normalizeTokenUser';
import type { TokenResponse, TokenUser } from './types';
import { stringStorage } from './storage/stringStorage';

const K = {
  ACCESS: 'mockhu_access_token',
  REFRESH: 'mockhu_refresh_token',
  EXPIRES_AT: 'mockhu_access_expires_at_ms',
  USER: 'mockhu_user_json',
  /** token_type, expires_in, extras from last TokenResponse */
  SESSION_META: 'mockhu_session_meta_json',
} as const;

export type SessionSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAtMs: number | null;
  /** From last `TokenResponse.token_type` (e.g. Bearer). */
  tokenType: string | null;
  /** From last `TokenResponse.expires_in` (seconds). */
  expiresInSeconds: number | null;
  /** Top-level keys on `TokenResponse` besides access/refresh/token_type/expires_in/user. */
  authExtras: Record<string, unknown> | null;
  user: TokenUser | null;
};

let snapshot: SessionSnapshot = {
  accessToken: null,
  refreshToken: null,
  accessExpiresAtMs: null,
  tokenType: null,
  expiresInSeconds: null,
  authExtras: null,
  user: null,
};

function mergeTokenUser(existing: TokenUser | null, incoming: TokenUser): TokenUser {
  if (existing == null) return normalizeTokenUserProfile(incoming);
  const sameAccount = String(existing.id) === String(incoming.id);
  if (!sameAccount) return normalizeTokenUserProfile(incoming);
  /** Same user: keep profile fields if refresh/login only returns `{ id, is_onboarded }`. */
  return normalizeTokenUserProfile({ ...existing, ...incoming });
}

/** Top-level fields on auth `data` that are stored separately — rest go to `authExtras`. */
const TOKEN_RESPONSE_CORE_KEYS = new Set([
  'access_token',
  'refresh_token',
  'token_type',
  'expires_in',
  'user',
]);

function authExtrasFromTokenResponse(tokens: TokenResponse): Record<string, unknown> | null {
  const row = tokens as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (!TOKEN_RESPONSE_CORE_KEYS.has(key)) out[key] = row[key];
  }
  return Object.keys(out).length ? out : null;
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function getSessionSnapshot(): SessionSnapshot {
  return snapshot;
}

/** Debug: log current session (full tokens only when `__DEV__` is true). */
export function logSessionSnapshot(context: string): void {
  const s = snapshot;
  const base = {
    user: s.user,
    accessExpiresAtMs: s.accessExpiresAtMs,
    tokenType: s.tokenType,
    expiresInSeconds: s.expiresInSeconds,
    authExtras: s.authExtras,
  };
  const dev =
    typeof __DEV__ !== 'undefined' && __DEV__;
  console.log(
    `[session] ${context}`,
    dev
      ? { ...base, accessToken: s.accessToken, refreshToken: s.refreshToken }
      : {
          ...base,
          accessTokenLength: s.accessToken?.length ?? 0,
          refreshTokenLength: s.refreshToken?.length ?? 0,
        },
  );
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
 * Merges `user` with any previously stored profile so refresh/login responses that only
 * return `{ id, is_onboarded }` do not wipe fields from onboarding or `/me`.
 */
export async function saveTokenResponse(tokens: TokenResponse): Promise<void> {
  const accessExpiresAtMs = Date.now() + Math.max(0, tokens.expires_in) * 1000;
  const mergedUser = mergeTokenUser(snapshot.user, tokens.user);
  const authExtras = authExtrasFromTokenResponse(tokens);
  const meta = {
    token_type: tokens.token_type,
    expires_in: tokens.expires_in,
    authExtras: authExtras ?? undefined,
  };
  await stringStorage.setItem(K.ACCESS, tokens.access_token);
  await stringStorage.setItem(K.REFRESH, tokens.refresh_token);
  await stringStorage.setItem(K.EXPIRES_AT, String(accessExpiresAtMs));
  await stringStorage.setItem(K.USER, JSON.stringify(mergedUser));
  await stringStorage.setItem(K.SESSION_META, JSON.stringify(meta));
  setSnapshot({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessExpiresAtMs,
    tokenType: tokens.token_type ?? null,
    expiresInSeconds: typeof tokens.expires_in === 'number' ? tokens.expires_in : null,
    authExtras,
    user: mergedUser,
  });
}

export async function loadPersistedSession(): Promise<SessionSnapshot> {
  const [access, refresh, exp, userJson, metaJson] = await Promise.all([
    stringStorage.getItem(K.ACCESS),
    stringStorage.getItem(K.REFRESH),
    stringStorage.getItem(K.EXPIRES_AT),
    stringStorage.getItem(K.USER),
    stringStorage.getItem(K.SESSION_META),
  ]);
  let user: TokenUser | null = null;
  if (userJson) {
    try {
      const parsed = JSON.parse(userJson) as Record<string, unknown>;
      if (!parsed || typeof parsed.is_onboarded !== 'boolean') {
        user = null;
      } else {
        const idRaw = parsed.id;
        const id =
          typeof idRaw === 'string'
            ? idRaw
            : typeof idRaw === 'number' && Number.isFinite(idRaw)
              ? String(idRaw)
              : null;
        if (id != null) {
          user = normalizeTokenUserProfile({
            ...(parsed as unknown as TokenUser),
            id,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }

  let tokenType: string | null = null;
  let expiresInSeconds: number | null = null;
  let authExtras: Record<string, unknown> | null = null;
  if (metaJson) {
    try {
      const meta = JSON.parse(metaJson) as {
        token_type?: string;
        expires_in?: number;
        authExtras?: Record<string, unknown> | null;
      };
      if (typeof meta.token_type === 'string') tokenType = meta.token_type;
      if (typeof meta.expires_in === 'number' && Number.isFinite(meta.expires_in)) {
        expiresInSeconds = meta.expires_in;
      }
      if (meta.authExtras && typeof meta.authExtras === 'object' && meta.authExtras !== null) {
        authExtras = meta.authExtras;
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
    tokenType,
    expiresInSeconds,
    authExtras,
    user,
  };
  setSnapshot(next);
  return next;
}

/**
 * Merge into the persisted user (e.g. after onboarding). No-op if not signed in.
 */
export async function mergeSessionUser(partial: Partial<TokenUser>): Promise<void> {
  const snap = snapshot;
  if (!snap.user) return;
  const next = normalizeTokenUserProfile({ ...snap.user, ...partial });
  await stringStorage.setItem(K.USER, JSON.stringify(next));
  setSnapshot({
    ...snap,
    user: next,
  });
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    stringStorage.removeItem(K.ACCESS),
    stringStorage.removeItem(K.REFRESH),
    stringStorage.removeItem(K.EXPIRES_AT),
    stringStorage.removeItem(K.USER),
    stringStorage.removeItem(K.SESSION_META),
  ]);
  setSnapshot({
    accessToken: null,
    refreshToken: null,
    accessExpiresAtMs: null,
    tokenType: null,
    expiresInSeconds: null,
    authExtras: null,
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
