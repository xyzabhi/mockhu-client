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
    const pick = (v: unknown): number | undefined => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
      return undefined;
    };
    return pick(a) ?? pick(b);
  };

  const level = numOr(r.level, undefined);
  const target_year = numOr(r.target_year, r.targetYear);

  const next: Record<string, unknown> = { ...r };
  delete next.firstName;
  delete next.lastName;
  delete next.userName;
  delete next.targetYear;

  if (first_name !== undefined) next.first_name = first_name;
  if (last_name !== undefined) next.last_name = last_name;
  if (username !== undefined) next.username = username;
  if (level !== undefined) next.level = level;
  if (target_year !== undefined) next.target_year = target_year;
  if (typeof r.tier === 'string' && r.tier.trim()) next.tier = r.tier.trim();
  if (typeof r.tier_color_hint === 'string' && r.tier_color_hint.trim()) {
    next.tier_color_hint = r.tier_color_hint.trim();
  }
  if (Array.isArray(r.special_badges)) {
    next.special_badges = r.special_badges.filter((b) => typeof b === 'string' && b.trim() !== '');
  }

  return next as unknown as TokenUser;
}
