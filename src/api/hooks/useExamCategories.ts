import { useCallback, useEffect, useState } from 'react';
import { examCatalogApi } from '../exam/examCatalogApi';
import type { ExamCategory } from '../exam/types';
import type { AppError } from '../AppError';
import { mapUnknownToAppError } from './mapUnknownToAppError';

export type UseExamCategoriesOptions = {
  /** When true, request `?active=all` (include inactive categories). */
  includeInactive?: boolean;
};

export function useExamCategories(options?: UseExamCategoriesOptions) {
  const includeInactive = options?.includeInactive ?? false;
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<ExamCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await examCatalogApi.listExamCategories(
          includeInactive ? 'all' : undefined,
        );
        if (!cancelled) setCategories(data);
      } catch (e) {
        if (!cancelled) setError(mapUnknownToAppError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [includeInactive, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  return { categories, loading, error, refresh };
}
