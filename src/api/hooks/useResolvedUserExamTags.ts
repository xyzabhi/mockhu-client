import { useEffect, useState } from 'react';
import { examCatalogApi } from '../exam/examCatalogApi';
import { useUserInterests } from './useUserInterests';

export type ResolvedExamTag = { id: number; name: string };

/**
 * Resolves `GET /users/:id/interests` exam ids to catalog names, sorted like Profile (user_count desc).
 */
export function useResolvedUserExamTags(userId: string | undefined | null): ResolvedExamTag[] {
  const uid = userId?.trim() || undefined;
  const { examIdsDirect } = useUserInterests(uid);
  const [tags, setTags] = useState<ResolvedExamTag[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!uid || examIdsDirect.length === 0) {
        setTags([]);
        return;
      }
      try {
        const settled = await Promise.allSettled(examIdsDirect.map((id) => examCatalogApi.getExam(id)));
        if (cancelled) return;
        const rows: { id: number; name: string; userCount: number }[] = [];
        settled.forEach((s, i) => {
          if (s.status !== 'fulfilled') return;
          const id = examIdsDirect[i];
          const name = s.value.name?.trim() || 'Exam';
          const userCount =
            typeof s.value.user_count === 'number' && Number.isFinite(s.value.user_count)
              ? s.value.user_count
              : 0;
          rows.push({ id, name, userCount });
        });
        rows.sort((a, b) => {
          if (b.userCount !== a.userCount) return b.userCount - a.userCount;
          return b.id - a.id;
        });
        setTags(rows.map(({ id, name }) => ({ id, name })));
      } catch {
        if (!cancelled) setTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, examIdsDirect]);

  return tags;
}
