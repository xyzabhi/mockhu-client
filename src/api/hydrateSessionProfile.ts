import { getSessionSnapshot, mergeSessionUser } from './sessionStore';
import { meResponseToTokenUserPatch } from './user/meResponseMap';
import { userApi } from './user/userApi';

export type HydrateSessionOptions = {
  /** Also `GET /users/:id/interests` and merge `exam_*` into session (default true). */
  includeInterests?: boolean;
};

/**
 * Fetches `GET /me` and merges into the cached user.
 * Optionally loads `GET /users/:id/interests` so exam lists match the server.
 */
export async function hydrateSessionUserFromMe(
  options?: HydrateSessionOptions,
): Promise<void> {
  if (!getSessionSnapshot().accessToken) return;
  const includeInterests = options?.includeInterests !== false;
  try {
    const me = await userApi.getCurrentUserProfile();
    await mergeSessionUser(meResponseToTokenUserPatch(me));

    if (includeInterests) {
      try {
        const ints = await userApi.getUserInterests(me.id);
        await mergeSessionUser({
          exam_category_ids: ints.exam_category_ids,
          exam_ids: ints.exam_ids,
        });
      } catch {
        /* interests route optional / 404 */
      }
    }
  } catch {
    /* 401 / 404 /me / offline — keep auth-only user from tokens */
  }
}
