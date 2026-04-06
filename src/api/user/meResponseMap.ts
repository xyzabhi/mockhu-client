import type { TokenUser } from '../types';
import type { MeResponse } from './types';

function nullToUndef<T>(v: T | null | undefined): T | undefined {
  if (v === null || v === undefined) return undefined;
  return v;
}

/** `/me` JSON may use numbers or numeric strings. */
function numOrUndef(n: unknown): number | undefined {
  if (n == null) return undefined;
  if (typeof n === 'number' && Number.isFinite(n)) return n;
  if (typeof n === 'string' && n.trim() !== '') {
    const v = Number(n);
    if (Number.isFinite(v)) return v;
  }
  return undefined;
}

function strOrUndef(s: string | null | undefined): string | undefined {
  if (s == null) return undefined;
  const t = typeof s === 'string' ? s.trim() : '';
  return t || undefined;
}

/**
 * Maps `/me` JSON into `TokenUser` partials for `mergeSessionUser`.
 * Prefers **top-level** `level`, `xp`, `tier`, `hp`, … then falls back to legacy `level_info` / `hp_info`.
 */
export function meResponseToTokenUserPatch(me: MeResponse): Partial<TokenUser> {
  const li = me.level_info;
  const hpLegacy = me.hp_info;

  const xpTop = numOrUndef(me.xp);
  const xpLi = li != null ? numOrUndef(li.total_xp) : undefined;
  const xpMerged = xpTop ?? xpLi;

  const levelTop = numOrUndef(me.level);
  const levelLi = li != null ? numOrUndef(li.level) : undefined;
  const levelMerged = levelTop ?? levelLi;

  const tierMerged = strOrUndef(me.tier) ?? (li != null ? strOrUndef(li.tier) : undefined);

  const hintRaw = me.tier_color_hint ?? li?.tier_color_hint;
  const hint =
    hintRaw != null && typeof hintRaw === 'string' && hintRaw.trim() !== ''
      ? hintRaw.trim()
      : undefined;

  const xpnTop = numOrUndef(me.xp_to_next_level);
  const xpnLi = li != null ? numOrUndef(li.xp_to_next_level) : undefined;
  const xpnMerged = xpnTop ?? xpnLi;

  const chTop = numOrUndef(me.current_hp);
  const mhTop = numOrUndef(me.max_hp);
  const chHp = hpLegacy != null ? numOrUndef(hpLegacy.current_hp) : undefined;
  const mhHp = hpLegacy != null ? numOrUndef(hpLegacy.max_hp) : undefined;
  const ch = chTop ?? chHp;
  const mh = mhTop ?? mhHp;

  const patch: Partial<TokenUser> = {
    id: me.id,
    is_onboarded: me.is_onboarded,
    username: nullToUndef(me.username),
    first_name: nullToUndef(me.first_name),
    last_name: nullToUndef(me.last_name),
    avatar_url: nullToUndef(me.avatar_url),
    bio: nullToUndef(me.bio),
    gender: nullToUndef(me.gender),
    grade: nullToUndef(me.grade),
    dob: nullToUndef(me.dob),
    created_at: me.created_at,
    updated_at: me.updated_at,
  };

  if (xpMerged !== undefined) {
    patch.xp = xpMerged;
  }
  if (levelMerged !== undefined) {
    patch.level = levelMerged;
  }
  if (tierMerged !== undefined) {
    patch.tier = tierMerged;
  }
  if (hint !== undefined) {
    patch.tier_color_hint = hint;
  }
  if (xpnMerged !== undefined) {
    patch.xp_to_next_level = xpnMerged;
  }

  if (ch !== undefined && mh !== undefined && mh > 0) {
    patch.current_hp = Math.max(0, Math.min(ch, mh));
    patch.max_hp = mh;
  }

  const badges = me.special_badges;
  if (Array.isArray(badges) && badges.length > 0) {
    patch.special_badges = badges.filter((b) => typeof b === 'string' && b.trim() !== '');
  }

  return patch;
}
