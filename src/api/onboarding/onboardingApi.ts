import { apiPost } from '../apiClient';
import type { OnboardingPayload, OnboardingResponseData } from './types';

/**
 * Authenticated POST; `apiClient` sets `Content-Type: application/json` and `Accept: application/json`.
 * Body must be snake_case (`OnboardingPayload`); do not send camelCase keys.
 */
export async function postOnboarding(
  body: OnboardingPayload,
): Promise<OnboardingResponseData> {
  return apiPost<OnboardingResponseData>('/onboarding', body);
}
