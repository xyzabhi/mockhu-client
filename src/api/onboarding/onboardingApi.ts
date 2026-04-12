import { apiPost } from '../apiClient';
import type { OnboardingPayload, OnboardingResponseData } from './types';

/**
 * Authenticated POST to `{EXPO_PUBLIC_MOCKHU_API_BASE_URL}/api/v1/onboarding`.
 * `apiClient` sets `Content-Type: application/json`, `Accept: application/json`,
 * and `Authorization: Bearer <access_token>` for authenticated routes.
 * Body must be snake_case (`OnboardingPayload`); do not send camelCase keys.
 */
export async function postOnboarding(
  body: OnboardingPayload,
): Promise<OnboardingResponseData> {
  return apiPost<OnboardingResponseData>('/onboarding', body);
}
