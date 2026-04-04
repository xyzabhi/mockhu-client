import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppError } from '../AppError';
import { userApi } from '../user/userApi';
import type { UserSummary } from '../user/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const DEFAULT_LIMIT = 20;

export type FollowListKind = 'followers' | 'following';

export type UseFollowListOptions = {
  /** Whose followers or following list to load. */
  userId: string | undefined;
  kind: FollowListKind;
  limit?: number;
};

/**
 * Cursor-paginated followers or following list (`GET .../followers` / `GET .../following`).
 */
export function useFollowList(options: UseFollowListOptions) {
  const { userId, kind, limit = DEFAULT_LIMIT } = options;
  const [reloadKey, setReloadKey] = useState(0);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const loadMoreInFlight = useRef(false);
  const listEpoch = useRef(0);

  useEffect(() => {
    listEpoch.current += 1;
    const myEpoch = listEpoch.current;
    if (!userId) {
      setUsers([]);
      setNextCursor(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setUsers([]);
      setNextCursor(null);
      try {
        const fetchFn =
          kind === 'followers' ? userApi.getFollowers : userApi.getFollowing;
        const data = await fetchFn(userId, { limit });
        if (!cancelled && listEpoch.current === myEpoch) {
          setUsers(data.users);
          setNextCursor(data.next_cursor);
        }
      } catch (e) {
        if (!cancelled && listEpoch.current === myEpoch) {
          setError(mapUnknownToAppError(e));
        }
      } finally {
        if (!cancelled && listEpoch.current === myEpoch) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, kind, limit, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!userId || nextCursor == null || loading || loadingMore || loadMoreInFlight.current) {
      return;
    }
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    setError(null);
    const myEpoch = listEpoch.current;
    try {
      const fetchFn =
        kind === 'followers' ? userApi.getFollowers : userApi.getFollowing;
      const data = await fetchFn(userId, { limit, cursor: nextCursor });
      if (listEpoch.current === myEpoch) {
        setUsers((prev) => [...prev, ...data.users]);
        setNextCursor(data.next_cursor);
      }
    } catch (e) {
      if (listEpoch.current === myEpoch) {
        setError(mapUnknownToAppError(e));
      }
    } finally {
      loadMoreInFlight.current = false;
      if (listEpoch.current === myEpoch) {
        setLoadingMore(false);
      }
    }
  }, [userId, kind, limit, nextCursor, loading, loadingMore]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const hasMore = nextCursor != null;

  return {
    users,
    nextCursor,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    hasMore,
  };
}
