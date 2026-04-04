import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { userApi } from '../user/userApi';
import type { UserSummary } from '../user/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const PAGE_SIZE = 20;

export function useUserSuggestions() {
  const [items, setItems] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.getUserSuggestions({ limit: PAGE_SIZE, offset: 0 });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(mapUnknownToAppError(e));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    if (items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await userApi.getUserSuggestions({
        limit: PAGE_SIZE,
        offset: items.length,
      });
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, items.length, total]);

  const refresh = useCallback(() => {
    void fetchInitial();
  }, [fetchInitial]);

  const hasMore = items.length < total;

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    hasMore,
  };
}
