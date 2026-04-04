import type { TokenUser } from '../types';
import type { MeResponse } from './types';

function nullToUndef<T>(v: T | null | undefined): T | undefined {
  if (v === null || v === undefined) return undefined;
  return v;
}

/** Maps `/me` JSON (with nulls) into `TokenUser` partials for `mergeSessionUser`. */
export function meResponseToTokenUserPatch(me: MeResponse): Partial<TokenUser> {
  return {
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
}
