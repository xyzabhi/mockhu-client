import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { postApi } from '../post/postApi';
import type { PostResponse } from '../post/types';
import { subscribePostBookmarkUpdate } from '../../shared/postBookmarkSync';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const PAGE_SIZE = 20;

/**
 * Cursor-paginated saved posts via `GET /api/v1/posts/bookmarks`.
 * Skips fetch when not signed in. Pass `feedActive: false` when the bookmarks UI is not visible (e.g. another profile tab).
 */
export function useBookmarkFeed(
  accessToken: string | null | undefined,
  feedActive = true,
) {
  const hasToken = Boolean(accessToken?.trim());
  const fetchEnabled = hasToken && feedActive;
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasToken && feedActive);
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
        const data = await postApi.getBookmarkFeed({ limit: PAGE_SIZE });
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
    [fetchEnabled],
  );

  useEffect(() => {
    if (!hasToken) {
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
  }, [hasToken, feedActive, loadFirstPage]);

  useEffect(() => {
    return subscribePostBookmarkUpdate((postId, patch) => {
      setPosts((prev) => {
        if (!patch.bookmarked_by_me) {
          return prev.filter((p) => p.id !== postId);
        }
        return prev.map((p) => (p.id === postId ? { ...p, ...patch } : p));
      });
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (!fetchEnabled || loading || loadingMore || refreshing || nextCursor == null) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await postApi.getBookmarkFeed({ limit: PAGE_SIZE, cursor: nextCursor });
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchEnabled, loading, loadingMore, refreshing, nextCursor]);

  const refresh = useCallback(() => loadFirstPage('refresh'), [loadFirstPage]);

  const hasMore = nextCursor != null;

  const updatePost = useCallback((updated: PostResponse) => {
    if (!updated.bookmarked_by_me) {
      setPosts((prev) => prev.filter((p) => p.id !== updated.id));
    } else {
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
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
  };
}
