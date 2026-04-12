import { apiGet } from '../apiClient';
import type {
  Exam,
  ExamCategory,
  ExamListData,
  ExamSubject,
  ExamTopic,
  ListExamsParams,
} from './types';

/** Catalog routes are public today — do not send Bearer. */
const publicOpts = { skipAuth: true } as const;

function buildPaginationQuery(params: { limit?: number; offset?: number }): string {
  const sp = new URLSearchParams();
  if (params.limit != null) {
    sp.set('limit', String(params.limit));
  }
  if (params.offset != null) {
    sp.set('offset', String(params.offset));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

function buildExamsQuery(params: ListExamsParams): string {
  const sp = new URLSearchParams();
  if (params.category_id != null) {
    sp.set('category_id', String(params.category_id));
  } else if (params.exam_category_id != null) {
    sp.set('exam_category_id', String(params.exam_category_id));
  }
  if (params.limit != null) {
    sp.set('limit', String(params.limit));
  }
  if (params.offset != null) {
    sp.set('offset', String(params.offset));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

/**
 * List exam categories. Omit `active` or pass anything except `'all'` → only active rows.
 * `active: 'all'` → include inactive (query `?active=all`).
 */
export async function listExamCategories(active?: 'all'): Promise<ExamCategory[]> {
  const suffix = active === 'all' ? '?active=all' : '';
  return apiGet<ExamCategory[]>(`/exam-categories${suffix}`, publicOpts);
}

export async function getExamCategory(id: number): Promise<ExamCategory> {
  return apiGet<ExamCategory>(`/exam-categories/${id}`, publicOpts);
}

/**
 * Active exams in a category. `404` if the category does not exist.
 * `GET /exam-categories/:id/exams?limit=&offset=`
 */
export async function listExamsByCategory(
  categoryId: number,
  params: { limit?: number; offset?: number } = {},
): Promise<ExamListData> {
  return apiGet<ExamListData>(
    `/exam-categories/${categoryId}/exams${buildPaginationQuery(params)}`,
    publicOpts,
  );
}

/** `GET /exams` — optional `category_id` or `exam_category_id` (alias; `category_id` wins if both). */
export async function listExams(params: ListExamsParams = {}): Promise<ExamListData> {
  return apiGet<ExamListData>(`/exams${buildExamsQuery(params)}`, publicOpts);
}

export async function getExam(id: number): Promise<Exam> {
  return apiGet<Exam>(`/exams/${id}`, publicOpts);
}

function coerceExamSubject(raw: Record<string, unknown>, index: number): ExamSubject {
  const subjectIdRaw = raw.subject_id ?? raw.id;
  const subject_id =
    typeof subjectIdRaw === 'string'
      ? subjectIdRaw
      : typeof subjectIdRaw === 'number' && Number.isFinite(subjectIdRaw)
        ? String(subjectIdRaw)
        : `subject_${index}`;
  const nameRaw = raw.name ?? raw.title;
  const name = typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : 'Subject';
  const color = typeof raw.color === 'string' ? raw.color : raw.color === null ? null : undefined;
  const weightage =
    typeof raw.weightage === 'number' && Number.isFinite(raw.weightage) ? raw.weightage : null;
  const sort_order =
    typeof raw.sort_order === 'number' && Number.isFinite(raw.sort_order)
      ? raw.sort_order
      : typeof raw.display_order === 'number' && Number.isFinite(raw.display_order)
        ? raw.display_order
        : null;
  const importance = typeof raw.importance === 'string' ? raw.importance : null;
  return { subject_id, name, color, weightage, sort_order, importance };
}

function normalizeExamSubjectsPayload(data: unknown): ExamSubject[] {
  let rows: unknown[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === 'object') {
    const r = data as Record<string, unknown>;
    const nested = r.subjects ?? r.items ?? r.data;
    if (Array.isArray(nested)) rows = nested;
  }
  return rows.map((row, i) =>
    row && typeof row === 'object' && !Array.isArray(row)
      ? coerceExamSubject(row as Record<string, unknown>, i)
      : coerceExamSubject({}, i),
  );
}

/** `GET /exams/:exam_id/subjects` — public catalog. */
export async function listExamSubjects(examId: number): Promise<ExamSubject[]> {
  const raw = await apiGet<unknown>(`/exams/${examId}/subjects`, publicOpts);
  return normalizeExamSubjectsPayload(raw);
}

function coerceExamTopic(raw: Record<string, unknown>, index: number): ExamTopic {
  const idRaw = raw.topic_id ?? raw.id;
  const topic_id =
    typeof idRaw === 'string'
      ? idRaw
      : typeof idRaw === 'number' && Number.isFinite(idRaw)
        ? String(idRaw)
        : `topic_${index}`;
  const nameRaw = raw.name ?? raw.title;
  const name = typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : 'Topic';
  const difficulty = typeof raw.difficulty === 'string' ? raw.difficulty : raw.difficulty === null ? null : undefined;
  const importance = typeof raw.importance === 'string' ? raw.importance : raw.importance === null ? null : undefined;
  const sort_order =
    typeof raw.sort_order === 'number' && Number.isFinite(raw.sort_order)
      ? raw.sort_order
      : typeof raw.display_order === 'number' && Number.isFinite(raw.display_order)
        ? raw.display_order
        : null;
  return { topic_id, name, difficulty, importance, sort_order };
}

function normalizeExamTopicsPayload(data: unknown): ExamTopic[] {
  let rows: unknown[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === 'object') {
    const r = data as Record<string, unknown>;
    const nested = r.topics ?? r.items ?? r.data;
    if (Array.isArray(nested)) rows = nested;
  }
  return rows.map((row, i) =>
    row && typeof row === 'object' && !Array.isArray(row)
      ? coerceExamTopic(row as Record<string, unknown>, i)
      : coerceExamTopic({}, i),
  );
}

/** `GET /exams/:exam_id/subjects/:subject_id/topics` — public; `subject_id` is URL-encoded in path. */
export async function listExamTopicsForSubject(
  examId: number,
  subjectId: string,
): Promise<ExamTopic[]> {
  const sid = encodeURIComponent(subjectId);
  const raw = await apiGet<unknown>(`/exams/${examId}/subjects/${sid}/topics`, publicOpts);
  return normalizeExamTopicsPayload(raw);
}

export const examCatalogApi = {
  listExamCategories,
  getExamCategory,
  listExamsByCategory,
  listExams,
  getExam,
  listExamSubjects,
  listExamTopicsForSubject,
};
