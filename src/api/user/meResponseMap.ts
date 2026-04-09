import type { TokenUser } from '../types';
import type { MeAvatarUploadResponse, MeResponse } from './types';

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
 * Level / tier for LevelBadge — top-level or legacy `level_info`.
 */
export function meResponseToTokenUserPatch(me: MeResponse): Partial<TokenUser> {
  const li = me.level_info;

  const levelTop = numOrUndef(me.level);
  const levelLi = li != null ? numOrUndef(li.level) : undefined;
  const levelMerged = levelTop ?? levelLi;

  const tierMerged = strOrUndef(me.tier) ?? (li != null ? strOrUndef(li.tier) : undefined);

  const hintRaw = me.tier_color_hint ?? li?.tier_color_hint;
  const hint =
    hintRaw != null && typeof hintRaw === 'string' && hintRaw.trim() !== ''
      ? hintRaw.trim()
      : undefined;

  const urls =
    me.avatar_urls != null && typeof me.avatar_urls === 'object'
      ? Object.fromEntries(
          Object.entries(me.avatar_urls).filter(
            ([k, v]) => typeof k === 'string' && typeof v === 'string' && v.trim() !== '',
          ),
        )
      : undefined;

  const patch: Partial<TokenUser> = {
    id: me.id,
    is_onboarded: me.is_onboarded,
    username: nullToUndef(me.username),
    first_name: nullToUndef(me.first_name),
    last_name: nullToUndef(me.last_name),
    avatar_url: nullToUndef(me.avatar_url),
    ...(urls && Object.keys(urls).length > 0 ? { avatar_urls: urls } : {}),
    ...(typeof me.avatar_updated_at === 'string' && me.avatar_updated_at.trim()
      ? { avatar_updated_at: me.avatar_updated_at.trim() }
      : {}),
    bio: nullToUndef(me.bio),
    gender: nullToUndef(me.gender),
    grade: nullToUndef(me.grade),
    dob: nullToUndef(me.dob),
    is_private: me.is_private === true,
    created_at: me.created_at,
    updated_at: me.updated_at,
  };

  if (levelMerged !== undefined) {
    patch.level = levelMerged;
  }
  if (tierMerged !== undefined) {
    patch.tier = tierMerged;
  }
  if (hint !== undefined) {
    patch.tier_color_hint = hint;
  }

  const badges = me.special_badges;
  if (Array.isArray(badges) && badges.length > 0) {
    patch.special_badges = badges.filter((b) => typeof b === 'string' && b.trim() !== '');
  }

  return patch;
}

/**
 * Maps `POST /me/avatar` success payload into `TokenUser` avatar fields.
 */
export function meAvatarUploadToTokenUserPatch(
  data: MeAvatarUploadResponse,
): Partial<TokenUser> {
  const urls =
    data.avatar_urls != null && typeof data.avatar_urls === 'object'
      ? Object.fromEntries(
          Object.entries(data.avatar_urls).filter(
            ([k, v]) => typeof k === 'string' && typeof v === 'string' && v.trim() !== '',
          ),
        )
      : undefined;

  return {
    avatar_url: data.avatar_url,
    ...(urls && Object.keys(urls).length > 0 ? { avatar_urls: urls } : {}),
    ...(typeof data.avatar_updated_at === 'string' && data.avatar_updated_at.trim()
      ? { avatar_updated_at: data.avatar_updated_at.trim() }
      : {}),
  };
}
