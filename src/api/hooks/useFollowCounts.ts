import { useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { userApi } from '../user/userApi';
import type { FollowListQuery } from '../user/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const PAGE_SIZE = 50;

async function countFollowListPages(
  userId: string,
  kind: 'followers' | 'following',
): Promise<number> {
  const fetchFn =
    kind === 'followers' ? userApi.getFollowers : userApi.getFollowing;
  let total = 0;
  let cursor: string | undefined = undefined;
  for (;;) {
    const q: FollowListQuery = { limit: PAGE_SIZE, cursor };
    const data = await fetchFn(userId, q);
    total += data.users.length;
    if (!data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return total;
}

/**
 * Exact followers / following counts for a user by paginating list endpoints until `next_cursor` is null.
 */
export function useFollowCounts(userId: string | undefined) {
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!userId) {
      setFollowersCount(null);
      setFollowingCount(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [f, g] = await Promise.all([
          countFollowListPages(userId, 'followers'),
          countFollowListPages(userId, 'following'),
        ]);
        if (!cancelled) {
          setFollowersCount(f);
          setFollowingCount(g);
        }
      } catch (e) {
        if (!cancelled) {
          setError(mapUnknownToAppError(e));
          setFollowersCount(null);
          setFollowingCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { followersCount, followingCount, loading, error };
}
