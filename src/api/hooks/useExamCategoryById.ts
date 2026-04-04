import { useEffect, useState } from 'react';
import { examCatalogApi } from '../exam/examCatalogApi';
import type { ExamCategory } from '../exam/types';
import type { AppError } from '../AppError';
import { mapUnknownToAppError } from './mapUnknownToAppError';

export function useExamCategoryById(id: number | null) {
  const [category, setCategory] = useState<ExamCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (id == null) {
      setCategory(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await examCatalogApi.getExamCategory(id);
        if (!cancelled) setCategory(data);
      } catch (e) {
        if (!cancelled) setError(mapUnknownToAppError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { category, loading, error };
}
