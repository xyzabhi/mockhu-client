import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { postApi } from '../post/postApi';
import type { PostResponse } from '../post/types';
import { subscribePostBookmarkUpdate } from '../../shared/postBookmarkSync';
import { subscribePostStarUpdate } from '../../shared/postStarSync';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const PAGE_SIZE = 20;

/**
 * Cursor-paginated posts for one user via `GET /api/v1/users/:user_id/posts`.
 */
export function useUserPostsFeed(
  accessToken: string | null | undefined,
  userId: string | undefined,
  feedActive = true,
) {
  const hasToken = Boolean(accessToken?.trim());
  const uid = userId?.trim() ?? '';
  const fetchEnabled = hasToken && uid.length > 0 && feedActive;

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(fetchEnabled);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const loadFirstPage = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!fetchEnabled) {
        if (mode === 'initial') setLoading(false);
        return;
      }
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const data = await postApi.getUserPostsFeed(uid, { limit: PAGE_SIZE });
        setPosts(data.posts);
        setNextCursor(data.next_cursor);
      } catch (e) {
        setError(mapUnknownToAppError(e));
        if (mode === 'initial') {
          setPosts([]);
          setNextCursor(null);
        }
      } finally {
        if (mode === 'initial') setLoading(false);
        else setRefreshing(false);
      }
    },
    [fetchEnabled, uid],
  );

  useEffect(() => {
    if (!hasToken || !uid) {
      setPosts([]);
      setNextCursor(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (!feedActive) {
      setLoading(false);
      return;
    }
    void loadFirstPage('initial');
  }, [hasToken, uid, feedActive, loadFirstPage]);

  useEffect(() => {
    return subscribePostStarUpdate((postId, patch) => {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
    });
  }, []);

  useEffect(() => {
    return subscribePostBookmarkUpdate((postId, patch) => {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (!fetchEnabled || loading || loadingMore || refreshing || nextCursor == null) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await postApi.getUserPostsFeed(uid, { limit: PAGE_SIZE, cursor: nextCursor });
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchEnabled, loading, loadingMore, refreshing, nextCursor, uid]);

  const refresh = useCallback(() => loadFirstPage('refresh'), [loadFirstPage]);

  const hasMore = nextCursor != null;

  const updatePost = useCallback((updated: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    loadMore,
    refresh,
    hasMore,
    updatePost,
    removePost,
  };
}
