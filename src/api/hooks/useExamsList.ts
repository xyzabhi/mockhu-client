import { useCallback, useEffect, useRef, useState } from 'react';
import { examCatalogApi } from '../exam/examCatalogApi';
import type { Exam } from '../exam/types';
import type { AppError } from '../AppError';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const DEFAULT_PAGE_SIZE = 20;

export type UseExamsListOptions = {
  categoryId?: number;
  pageSize?: number;
};

export function useExamsList(options: UseExamsListOptions = {}) {
  const { categoryId, pageSize = DEFAULT_PAGE_SIZE } = options;
  const [reloadKey, setReloadKey] = useState(0);
  const [items, setItems] = useState<Exam[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const loadMoreInFlight = useRef(false);
  /** Bumps when the list query identity changes so stale loadMore / fetch responses are ignored. */
  const listEpoch = useRef(0);

  useEffect(() => {
    listEpoch.current += 1;
    const myEpoch = listEpoch.current;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setItems([]);
      setTotal(0);
      try {
        const data =
          categoryId != null
            ? await examCatalogApi.listExamsByCategory(categoryId, {
                limit: pageSize,
                offset: 0,
              })
            : await examCatalogApi.listExams({
                limit: pageSize,
                offset: 0,
              });
        if (!cancelled && listEpoch.current === myEpoch) {
          setItems(data.items);
          setTotal(data.total);
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
  }, [categoryId, pageSize, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || loadMoreInFlight.current) return;
    if (items.length >= total) return;

    const myEpoch = listEpoch.current;
    const offset = items.length;

    loadMoreInFlight.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const data =
        categoryId != null
          ? await examCatalogApi.listExamsByCategory(categoryId, {
              limit: pageSize,
              offset,
            })
          : await examCatalogApi.listExams({
              limit: pageSize,
              offset,
            });
      if (listEpoch.current !== myEpoch) return;
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    } catch (e) {
      if (listEpoch.current === myEpoch) {
        setError(mapUnknownToAppError(e));
      }
    } finally {
      loadMoreInFlight.current = false;
      setLoadingMore(false);
    }
  }, [loading, loadingMore, items.length, total, categoryId, pageSize]);

  const hasMore = items.length < total;

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}
