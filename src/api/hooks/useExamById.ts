import { useEffect, useState } from 'react';
import { examCatalogApi } from '../exam/examCatalogApi';
import type { Exam } from '../exam/types';
import type { AppError } from '../AppError';
import { mapUnknownToAppError } from './mapUnknownToAppError';

export function useExamById(id: number | null) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (id == null) {
      setExam(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await examCatalogApi.getExam(id);
        if (!cancelled) setExam(data);
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

  return { exam, loading, error };
}
