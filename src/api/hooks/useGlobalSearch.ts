import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppError } from '../AppError';
import { searchApi } from '../search/searchApi';
import type { GlobalSearchResponse, SearchType } from '../search/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const DEBOUNCE_MS = 400;

const EMPTY: GlobalSearchResponse = {
  users: [],
  posts: [],
  exams: [],
  exam_categories: [],
  topics: [],
  subjects: [],
};

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQueryRef = useRef('');

  const search = useCallback(async (q: string, type?: SearchType, limit?: number) => {
    const trimmed = q.trim();
    activeQueryRef.current = trimmed;
    if (!trimmed) {
      setResults(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchApi.globalSearch({ q: trimmed, type, limit });
      if (activeQueryRef.current === trimmed) {
        setResults(data);
      }
    } catch (e) {
      if (activeQueryRef.current === trimmed) {
        setError(mapUnknownToAppError(e));
      }
    } finally {
      if (activeQueryRef.current === trimmed) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      activeQueryRef.current = '';
      setResults(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      void search(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  const searchByType = useCallback(
    (type: SearchType, limit = 20) => {
      void search(query, type, limit);
    },
    [query, search],
  );

  const isEmpty =
    !loading &&
    query.trim().length > 0 &&
    results.users.length === 0 &&
    results.posts.length === 0 &&
    results.exams.length === 0 &&
    results.exam_categories.length === 0 &&
    results.topics.length === 0 &&
    results.subjects.length === 0;

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    isEmpty,
    searchByType,
  };
}
