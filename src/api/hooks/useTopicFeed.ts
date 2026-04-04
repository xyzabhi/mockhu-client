import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { postApi } from '../post/postApi';
import type { PostResponse } from '../post/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const PAGE_SIZE = 20;

export function useTopicFeed(topicId: number | undefined) {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetchInitial = useCallback(async () => {
    if (topicId == null) {
      setPosts([]);
      setNextCursor(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postApi.getTopicFeed(topicId, { limit: PAGE_SIZE });
      setPosts(data.posts);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
      setPosts([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (topicId == null || loading || loadingMore || nextCursor == null) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await postApi.getTopicFeed(topicId, { limit: PAGE_SIZE, cursor: nextCursor });
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setLoadingMore(false);
    }
  }, [topicId, loading, loadingMore, nextCursor]);

  const refresh = useCallback(async () => {
    if (topicId == null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postApi.getTopicFeed(topicId, { limit: PAGE_SIZE });
      setPosts(data.posts);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setLoading(false);
    }
  }, [topicId]);

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
    loadingMore,
    error,
    loadMore,
    refresh,
    hasMore,
    removePost,
    updatePost,
  };
}
