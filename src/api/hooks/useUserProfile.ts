import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { userApi } from '../user/userApi';
import type { UserProfileResponse } from '../user/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

export function isProfileRestricted(p: UserProfileResponse): boolean {
  return p.is_private && !p.is_own_profile && !p.is_following;
}

/**
 * Fetch a user's public profile via `GET /api/v1/users/:id/profile`.
 * Privacy gating is server-side — restricted fields arrive as null.
 */
export function useUserProfile(userId: string | undefined) {
  const uid = userId?.trim() ?? '';
  const enabled = uid.length > 0;

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<AppError | null>(null);

  const fetchProfile = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await userApi.getUserProfile(uid);
        setProfile(data);
      } catch (e) {
        setError(mapUnknownToAppError(e));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [enabled, uid],
  );

  useEffect(() => {
    if (!enabled) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    void fetchProfile();
  }, [enabled, fetchProfile]);

  const refresh = useCallback(() => fetchProfile(false), [fetchProfile]);
  const silentRefresh = useCallback(() => fetchProfile(true), [fetchProfile]);

  return { profile, loading, error, refresh, silentRefresh, setProfile };
}
