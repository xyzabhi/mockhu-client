import { apiGet } from '../apiClient';
import type { Exam, ExamCategory, ExamListData, ListExamsParams } from './types';

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

export const examCatalogApi = {
  listExamCategories,
  getExamCategory,
  listExamsByCategory,
  listExams,
  getExam,
};
