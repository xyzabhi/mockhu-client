import { useCallback, useEffect, useMemo, useState } from 'react';
import { examCatalogApi } from '../exam/examCatalogApi';
import type { ExamSubject } from '../exam/types';
import { userApi } from '../user/userApi';

export type TrackerExamSubjectsGroup = {
  examId: number;
  examName: string;
  subjects: ExamSubject[];
  loadError?: string;
};

export function useTrackerExamSubjects(options: {
  enabled: boolean;
  userId: string | null | undefined;
  accessToken: string | null | undefined;
  examIdsFallback: number[];
}) {
  const { enabled, userId, accessToken, examIdsFallback } = options;
  const fallbackKey = useMemo(() => examIdsFallback.join(','), [examIdsFallback]);

  const [groups, setGroups] = useState<TrackerExamSubjectsGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !userId?.trim() || !accessToken?.trim()) {
      setGroups([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let exams: { id: number; name: string }[] = [];
      try {
        const list = await userApi.getMyExams();
        exams = list
          .filter((e) => e?.id != null && Number.isFinite(Number(e.id)))
          .map((e) => ({ id: Number(e.id), name: e.name?.trim() || `Exam ${e.id}` }));
      } catch {
        /* use interest ids */
      }

      if (exams.length === 0 && fallbackKey.length > 0) {
        const ids = fallbackKey
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n));
        if (ids.length > 0) {
          const settled = await Promise.allSettled(ids.map((id) => examCatalogApi.getExam(id)));
          exams = ids.map((id, i) => {
            const s = settled[i];
            const name =
              s?.status === 'fulfilled' ? s.value.name?.trim() || `Exam ${id}` : `Exam ${id}`;
            return { id, name };
          });
        }
      }

      if (exams.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const subjectGroups = await Promise.all(
        exams.map(async (exam) => {
          try {
            const subjects = await examCatalogApi.listExamSubjects(exam.id);
            return {
              examId: exam.id,
              examName: exam.name,
              subjects: subjects ?? [],
            } satisfies TrackerExamSubjectsGroup;
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Could not load subjects';
            return {
              examId: exam.id,
              examName: exam.name,
              subjects: [],
              loadError: msg,
            };
          }
        }),
      );
      setGroups(subjectGroups);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load subjects');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, userId, accessToken, fallbackKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { groups, loading, error, refresh: load };
}
