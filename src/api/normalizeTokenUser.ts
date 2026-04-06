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

  const level = numOr(r.level, undefined);
  if (level !== undefined) next.level = level;
  if (typeof r.tier === 'string' && r.tier.trim()) next.tier = r.tier.trim();
  if (typeof r.tier_color_hint === 'string' && r.tier_color_hint.trim()) {
    next.tier_color_hint = r.tier_color_hint.trim();
  }
  const xpn = numOr(r.xp_to_next_level, undefined);
  if (xpn !== undefined) next.xp_to_next_level = xpn;
  if (Array.isArray(r.special_badges)) {
    next.special_badges = r.special_badges.filter((b) => typeof b === 'string' && b.trim() !== '');
  }
  const ch = numOr(r.current_hp, undefined);
  const mh = numOr(r.max_hp, undefined);
  if (ch !== undefined) next.current_hp = ch;
  if (mh !== undefined) next.max_hp = mh;

  return next as unknown as TokenUser;
}
