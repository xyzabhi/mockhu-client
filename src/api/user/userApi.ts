import { apiGet } from '../apiClient';
import type { MeResponse, UserInterestsResponse } from './types';

/** `GET /api/v1/me` — JWT required; not a public route. */
export async function getCurrentUserProfile(): Promise<MeResponse> {
  return apiGet<MeResponse>('/me');
}

/** `GET /api/v1/users/:user_id/interests` — interests (separate from `/me`). */
export async function getUserInterests(userId: string): Promise<UserInterestsResponse> {
  return apiGet<UserInterestsResponse>(`/users/${encodeURIComponent(userId)}/interests`);
}

export const userApi = {
  getCurrentUserProfile,
  getUserInterests,
};
