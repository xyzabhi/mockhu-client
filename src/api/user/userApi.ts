import type { Exam } from '../exam/types';
import { apiDelete, apiGet, apiPatch, apiPost, apiPostMultipart } from '../apiClient';
import type {
  FollowListQuery,
  FollowListResponse,
  FollowResponse,
  MeAvatarUploadResponse,
  MeResponse,
  PatchMeRequest,
  SetPrivacyResponse,
  UserInterestsResponse,
  UserProfileResponse,
  UserSuggestionsResponse,
  UserSummary,
} from './types';

/** `GET /api/v1/me` — JWT required; not a public route. */
export async function getCurrentUserProfile(): Promise<MeResponse> {
  return apiGet<MeResponse>('/me');
}

/**
 * `POST /api/v1/me/avatar` — multipart; field `file` or `avatar`; max 2 MiB; JPEG/PNG/WebP/GIF.
 * Send local `file://` / `content://` URIs (React Native). Do not set `Content-Type` on the request.
 */
export async function uploadMeAvatar(localUri: string): Promise<MeAvatarUploadResponse> {
  const fd = new FormData();
  fd.append(
    'file',
    {
      uri: localUri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as unknown as Blob,
  );
  return apiPostMultipart<MeAvatarUploadResponse>('/me/avatar', fd);
}

/** `GET /api/v1/users/:id/profile` — any user's profile; privacy handled server-side. */
export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  return apiGet<UserProfileResponse>(`/users/${encodeURIComponent(userId)}/profile`);
}

/** `PATCH /api/v1/me/privacy` — toggle account privacy. */
export async function setPrivacy(isPrivate: boolean): Promise<SetPrivacyResponse> {
  return apiPatch<SetPrivacyResponse>('/me/privacy', { is_private: isPrivate });
}

/**
 * `PATCH /api/v1/me` — update profile fields (requires backend support).
 * Returns updated `MeResponse` for merging into session.
 */
export async function patchMe(body: PatchMeRequest): Promise<MeResponse> {
  return apiPatch<MeResponse>('/me', body);
}

/**
 * `PATCH /api/v1/users/:user_id/interests` — replace exam / category interests (requires backend support).
 */
export async function patchUserInterests(
  userId: string,
  body: UserInterestsResponse,
): Promise<UserInterestsResponse> {
  return apiPatch<UserInterestsResponse>(
    `/users/${encodeURIComponent(userId)}/interests`,
    body,
  );
}

/** `GET /api/v1/users/:user_id/interests` — interests (separate from `/me`). */
export async function getUserInterests(userId: string): Promise<UserInterestsResponse> {
  return apiGet<UserInterestsResponse>(`/users/${encodeURIComponent(userId)}/interests`);
}

function normalizeMyExamsPayload(data: unknown): Exam[] {
  if (Array.isArray(data)) return data as Exam[];
  if (data && typeof data === 'object') {
    const r = data as Record<string, unknown>;
    const raw = r.exams ?? r.items;
    if (Array.isArray(raw)) return raw as Exam[];
  }
  return [];
}

/** `GET /api/v1/me/exams` — JWT; full exam rows in onboarding / interest order. */
export async function getMyExams(): Promise<Exam[]> {
  const raw = await apiGet<unknown>('/me/exams');
  return normalizeMyExamsPayload(raw);
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
  /** Some backends return a bare array as `data` after envelope unwrap. */
  if (Array.isArray(data)) {
    const items = (data as UserSummary[]).map((u) => ({
      ...u,
      id: typeof u.id === 'string' ? u.id : String(u.id),
    }));
    return { items, total: items.length };
  }
  if (!data || typeof data !== 'object') {
    return { items: [], total: 0 };
  }
  const r = data as Record<string, unknown>;
  const raw =
    (Array.isArray(r.items) ? r.items : null) ??
    (Array.isArray(r.users) ? r.users : null) ??
    (Array.isArray(r.suggestions) ? r.suggestions : null) ??
    (Array.isArray(r.results) ? r.results : null) ??
    (Array.isArray(r.data) ? r.data : null) ??
    [];
  const items = (raw as UserSummary[]).map((u) => ({
    ...u,
    id: typeof u.id === 'string' ? u.id : String(u.id),
  }));
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

/** `GET /api/v1/users/suggestions/interests` — interest-based suggestions; falls back to general. */
export async function getInterestSuggestions(params?: {
  limit?: number;
  offset?: number;
}): Promise<UserSuggestionsResponse> {
  const q = buildSuggestionsQuery(params);
  const raw = await apiGet<unknown>(`/users/suggestions/interests${q}`);
  return normalizeSuggestionsPayload(raw);
}

export const userApi = {
  getCurrentUserProfile,
  getUserProfile,
  patchMe,
  patchUserInterests,
  setPrivacy,
  uploadMeAvatar,
  getMyExams,
  getUserInterests,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserSuggestions,
  getInterestSuggestions,
};
