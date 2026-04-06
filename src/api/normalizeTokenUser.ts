import type { TokenUser } from './types';

/**
 * Ensures snake_case profile fields used by the app, merging from common API aliases.
 * Removes camelCase duplicates so persisted JSON stays consistent.
 */
export function normalizeTokenUserProfile(u: TokenUser): TokenUser {
  const r = u as unknown as Record<string, unknown>;
  const str = (a: unknown, b: unknown): string | undefined => {
    const s1 = typeof a === 'string' ? a.trim() : '';
    const s2 = typeof b === 'string' ? b.trim() : '';
    const out = s1 || s2;
    return out || undefined;
  };

  const first_name = str(r.first_name, r.firstName);
  const last_name = str(r.last_name, r.lastName);
  const username = str(r.username, r.userName);

  const numOr = (a: unknown, b: unknown): number | undefined => {
    const pick = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    return pick(a) ?? pick(b);
  };
  const xp = numOr(r.xp, r.total_xp);

  const next: Record<string, unknown> = { ...r };
  delete next.firstName;
  delete next.lastName;
  delete next.userName;
  delete next.total_xp;

  if (first_name !== undefined) next.first_name = first_name;
  if (last_name !== undefined) next.last_name = last_name;
  if (username !== undefined) next.username = username;
  if (xp !== undefined) next.xp = xp;

  return next as unknown as TokenUser;
}
