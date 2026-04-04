import { apiDelete, apiGet, apiPost } from '../apiClient';
import type {
  FollowListQuery,
  FollowListResponse,
  FollowResponse,
  MeResponse,
  UserInterestsResponse,
  UserSuggestionsResponse,
  UserSummary,
} from './types';

/** `GET /api/v1/me` — JWT required; not a public route. */
export async function getCurrentUserProfile(): Promise<MeResponse> {
  return apiGet<MeResponse>('/me');
}

/** `GET /api/v1/users/:user_id/interests` — interests (separate from `/me`). */
export async function getUserInterests(userId: string): Promise<UserInterestsResponse> {
  return apiGet<UserInterestsResponse>(`/users/${encodeURIComponent(userId)}/interests`);
}

function buildFollowListQuery(params?: FollowListQuery): string {
  const sp = new URLSearchParams();
  if (params?.limit != null) {
    sp.set('limit', String(params.limit));
  }
  if (params?.cursor) {
    sp.set('cursor', params.cursor);
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

/** `POST /api/v1/users/:id/follow` — JWT required; `:id` is the user to follow. */
export async function followUser(userId: string): Promise<FollowResponse> {
  return apiPost<FollowResponse>(`/users/${encodeURIComponent(userId)}/follow`, {});
}

/** `DELETE /api/v1/users/:id/follow` — JWT required; idempotent if not following. */
export async function unfollowUser(userId: string): Promise<FollowResponse> {
  return apiDelete<FollowResponse>(`/users/${encodeURIComponent(userId)}/follow`);
}

/** `GET /api/v1/users/:id/followers` — JWT required. */
export async function getFollowers(
  userId: string,
  params?: FollowListQuery,
): Promise<FollowListResponse> {
  const q = buildFollowListQuery(params);
  return apiGet<FollowListResponse>(`/users/${encodeURIComponent(userId)}/followers${q}`);
}

/** `GET /api/v1/users/:id/following` — JWT required. */
export async function getFollowing(
  userId: string,
  params?: FollowListQuery,
): Promise<FollowListResponse> {
  const q = buildFollowListQuery(params);
  return apiGet<FollowListResponse>(`/users/${encodeURIComponent(userId)}/following${q}`);
}

function buildSuggestionsQuery(params?: { limit?: number; offset?: number }): string {
  const sp = new URLSearchParams();
  if (params?.limit != null) {
    sp.set('limit', String(params.limit));
  }
  if (params?.offset != null) {
    sp.set('offset', String(params.offset));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

function normalizeSuggestionsPayload(data: unknown): UserSuggestionsResponse {
  if (!data || typeof data !== 'object') {
    return { items: [], total: 0 };
  }
  const r = data as Record<string, unknown>;
  const raw =
    (Array.isArray(r.items) ? r.items : null) ??
    (Array.isArray(r.users) ? r.users : null) ??
    [];
  const items = raw as UserSummary[];
  const total =
    typeof r.total === 'number'
      ? r.total
      : typeof r.count === 'number'
        ? r.count
        : items.length;
  return { items, total };
}

/** `GET /api/v1/users/suggestions` — JWT required; paginated with limit/offset. */
export async function getUserSuggestions(params?: {
  limit?: number;
  offset?: number;
}): Promise<UserSuggestionsResponse> {
  const q = buildSuggestionsQuery(params);
  const raw = await apiGet<unknown>(`/users/suggestions${q}`);
  return normalizeSuggestionsPayload(raw);
}

export const userApi = {
  getCurrentUserProfile,
  getUserInterests,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserSuggestions,
};
