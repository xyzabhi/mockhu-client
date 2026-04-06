import { useCallback, useRef, useState } from 'react';
import type { AppError } from '../AppError';
import { postApi } from '../post/postApi';
import type { LinkPreviewData } from '../post/types';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const DEBOUNCE_MS = 400;

/**
 * Debounced link preview with in-memory cache for the current compose session.
 */
export function useLinkPreview() {
  const cache = useRef(new Map<string, LinkPreviewData>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const schedulePreview = useCallback((url: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const id = ++requestIdRef.current;

    timerRef.current = setTimeout(() => {
      const trimmed = url.trim();
      if (!trimmed) {
        if (id !== requestIdRef.current) return;
        setPreview(null);
        setError(null);
        setLoading(false);
        return;
      }

      const hit = cache.current.get(trimmed);
      if (hit) {
        if (id !== requestIdRef.current) return;
        setPreview(hit);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      void (async () => {
        try {
          const data = await postApi.getLinkPreview(trimmed);
          if (id !== requestIdRef.current) return;
          cache.current.set(trimmed, data);
          setPreview(data);
        } catch (e) {
          if (id !== requestIdRef.current) return;
          setPreview(null);
          setError(mapUnknownToAppError(e));
        } finally {
          if (id === requestIdRef.current) {
            setLoading(false);
          }
        }
      })();
    }, DEBOUNCE_MS);
  }, []);

  const clearPreview = useCallback(() => {
    requestIdRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPreview(null);
    setError(null);
    setLoading(false);
  }, []);

  return { preview, loading, error, schedulePreview, clearPreview };
}
