import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import { examCatalogApi } from '../exam/examCatalogApi';
import type { UserInterestsResponse } from '../user/types';
import { userApi } from '../user/userApi';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const EXAMS_PAGE = 100;

async function fetchAllExamIdsInCategory(categoryId: number): Promise<number[]> {
  const ids: number[] = [];
  let offset = 0;
  const limit = EXAMS_PAGE;
  for (;;) {
    const data = await examCatalogApi.listExamsByCategory(categoryId, { limit, offset });
    for (const e of data.items) ids.push(e.id);
    if (data.items.length < limit) break;
    offset += data.items.length;
  }
  return ids;
}

/**
 * `exam_ids` from the API plus every exam id under `exam_category_ids` (catalog pagination).
 */
export async function expandInterestsToExamIds(res: UserInterestsResponse): Promise<number[]> {
  const set = new Set<number>();
  for (const id of res.exam_ids ?? []) set.add(id);
  const cats = res.exam_category_ids ?? [];
  if (cats.length > 0) {
    const nested = await Promise.all(cats.map((cid) => fetchAllExamIdsInCategory(cid)));
    for (const list of nested) list.forEach((id) => set.add(id));
  }
  return [...set];
}

export type UseUserInterestsResult = {
  /** Raw `GET /users/:id/interests` payload (null if no user or error). */
  interests: UserInterestsResponse | null;
  /** `exam_ids` ∪ exams in selected categories — for feed / topic filters. */
  examIdsForFilter: number[];
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
};

/**
 * Loads `GET /api/v1/users/:user_id/interests` and expands category interests into exam ids.
 */
export function useUserInterests(userId: string | undefined): UseUserInterestsResult {
  const [interests, setInterests] = useState<UserInterestsResponse | null>(null);
  const [examIdsForFilter, setExamIdsForFilter] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId) {
      setInterests(null);
      setExamIdsForFilter([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userApi.getUserInterests(userId);
        if (cancelled) return;
        setInterests(res);
        const ids = await expandInterestsToExamIds(res);
        if (cancelled) return;
        setExamIdsForFilter(ids);
      } catch (e) {
        if (!cancelled) {
          setError(mapUnknownToAppError(e));
          setInterests(null);
          setExamIdsForFilter([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  return { interests, examIdsForFilter, loading, error, refetch };
}
