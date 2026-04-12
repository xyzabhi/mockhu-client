import { examCatalogApi } from '../../api/exam/examCatalogApi';

const nameCache = new Map<number, string>();
const inflight = new Map<number, Promise<string>>();

/**
 * Deduped catalog lookup for post cards and other UI that only needs the exam title.
 */
export function getCachedExamName(examId: number): Promise<string> {
  const hit = nameCache.get(examId);
  if (hit) return Promise.resolve(hit);
  const existing = inflight.get(examId);
  if (existing) return existing;
  const p = examCatalogApi
    .getExam(examId)
    .then((e) => {
      const n = e.name?.trim() || `Exam ${examId}`;
      nameCache.set(examId, n);
      return n;
    })
    .catch(() => {
      const fallback = `Exam ${examId}`;
      nameCache.set(examId, fallback);
      return fallback;
    })
    .finally(() => {
      inflight.delete(examId);
    });
  inflight.set(examId, p);
  return p;
}
