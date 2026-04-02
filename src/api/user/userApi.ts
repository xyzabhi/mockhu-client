import { apiGet } from '../apiClient';

/**
 * Thin example of a feature module using the shared client.
 * Replace the path and response type when the backend route is finalized.
 */
export async function getCurrentUserProfile(): Promise<unknown> {
  return apiGet<unknown>('/users/me');
}

export const userApi = {
  getCurrentUserProfile,
};
