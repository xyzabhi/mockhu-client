import { useCallback, useState } from 'react';
import type { AppError } from '../AppError';
import { userApi } from '../user/userApi';
import type { FollowResponse } from '../user/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

/**
 * Follow / unfollow another user (`POST` / `DELETE /api/v1/users/:id/follow`).
 * Returns the followed user’s `followers_count` from the API.
 */
export function useFollow() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const follow = useCallback(async (userId: string): Promise<FollowResponse> => {
    setPending(true);
    setError(null);
    try {
      return await userApi.followUser(userId);
    } catch (e) {
      const err = mapUnknownToAppError(e);
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  const unfollow = useCallback(async (userId: string): Promise<FollowResponse> => {
    setPending(true);
    setError(null);
    try {
      return await userApi.unfollowUser(userId);
    } catch (e) {
      const err = mapUnknownToAppError(e);
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { follow, unfollow, pending, error, clearError };
}
