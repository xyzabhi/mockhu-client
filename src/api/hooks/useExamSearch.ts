import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppError } from '../AppError';
import { searchApi } from '../search/searchApi';
import type { SearchExamResult } from '../search/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const DEBOUNCE_MS = 400;

/**
 * Debounced exam search: `GET /api/v1/search?q=…&type=exams&limit=…`
 */
export function useExamSearch() {
  const [query, setQuery] = useState('');
  const [exams, setExams] = useState<SearchExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQueryRef = useRef('');

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    activeQueryRef.current = trimmed;
    if (!trimmed) {
      setExams([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchApi.globalSearch({ q: trimmed, type: 'exams', limit: 40 });
      if (activeQueryRef.current === trimmed) {
        setExams(data.exams);
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
      setExams([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      void runSearch(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  const refetch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) void runSearch(trimmed);
  }, [query, runSearch]);

  return { query, setQuery, exams, loading, error, refetch };
}
