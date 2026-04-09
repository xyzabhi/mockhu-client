import { apiGet } from '../apiClient';
import type { GlobalSearchResponse, SearchParams } from './types';

function buildSearchQuery(params: SearchParams): string {
  const sp = new URLSearchParams();
  sp.set('q', params.q);
  if (params.type) sp.set('type', params.type);
  if (params.limit != null) sp.set('limit', String(params.limit));
  return `?${sp.toString()}`;
}

const EMPTY_RESULTS: GlobalSearchResponse = {
  users: [],
  posts: [],
  exams: [],
  exam_categories: [],
  topics: [],
  subjects: [],
};

function normalizeSearchResponse(raw: unknown): GlobalSearchResponse {
  if (!raw || typeof raw !== 'object') return EMPTY_RESULTS;
  const r = raw as Record<string, unknown>;
  return {
    users: Array.isArray(r.users) ? r.users : [],
    posts: Array.isArray(r.posts) ? r.posts : [],
    exams: Array.isArray(r.exams) ? r.exams : [],
    exam_categories: Array.isArray(r.exam_categories) ? r.exam_categories : [],
    topics: Array.isArray(r.topics) ? r.topics : [],
    subjects: Array.isArray(r.subjects) ? r.subjects : [],
  };
}

/** `GET /api/v1/search?q=…&type=…&limit=…` */
export async function globalSearch(params: SearchParams): Promise<GlobalSearchResponse> {
  const q = buildSearchQuery(params);
  const raw = await apiGet<unknown>(`/search${q}`);
  return normalizeSearchResponse(raw);
}

export const searchApi = { globalSearch };
