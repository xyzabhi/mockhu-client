import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { postApi } from '../post/postApi';
import type { PostResponse } from '../post/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const PAGE_SIZE = 20;

/** Cursor-paginated global feed via `GET /api/v1/posts/home` (see `getHomeFeed`). */
export function useHomeFeed() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const loadFirstPage = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await postApi.getHomeFeed({ limit: PAGE_SIZE });
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
  }, []);

  useEffect(() => {
    void loadFirstPage('initial');
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || refreshing || nextCursor == null) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await postApi.getHomeFeed({ limit: PAGE_SIZE, cursor: nextCursor });
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, refreshing, nextCursor]);

  const refresh = useCallback(() => loadFirstPage('refresh'), [loadFirstPage]);

  const hasMore = nextCursor != null;

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const updatePost = useCallback((updated: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
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
    removePost,
    updatePost,
  };
}
