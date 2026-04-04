export { AppError, type AppErrorKind } from './AppError';
export {
  apiClient,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  type ApiRequestInit,
} from './apiClient';
export {
  getApiBaseUrl,
  getApiV1Url,
  getDevNetworkDelayMs,
  getHealthUrl,
} from './config';
export {
  hydrateSessionUserFromMe,
  type HydrateSessionOptions,
} from './hydrateSessionProfile';
export { getHealth } from './health';
export { normalizeTokenUserProfile } from './normalizeTokenUser';
export { parseApiResponse, isApiEnvelope } from './parseApiResponse';
export { refreshTokens } from './refreshCoordinator';
export { setReauthHandler, notifyReauthRequired } from './reauth';
export {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSessionSnapshot,
  isAccessTokenExpired,
  loadPersistedSession,
  logSessionSnapshot,
  mergeSessionUser,
  saveTokenResponse,
  subscribeSession,
  type SessionSnapshot,
} from './sessionStore';
export type {
  ApiEnvelope,
  ApiErrorBody,
  ApiErrorCode,
  ApiFailureEnvelope,
  ApiSuccessEnvelope,
  TokenResponse,
  TokenUser,
} from './types';

export { authApi } from './auth/authApi';
export type * from './auth/types';

export { userApi } from './user/userApi';
export type { MeResponse, UserInterestsResponse } from './user/types';
export { meResponseToTokenUserPatch } from './user/meResponseMap';

export { examCatalogApi } from './exam/examCatalogApi';
export type { Exam, ExamCategory, ExamListData, ListExamsParams } from './exam/types';

export { postOnboarding } from './onboarding/onboardingApi';
export type { OnboardingPayload, OnboardingResponseData } from './onboarding/types';

export { useSession, type UseSessionResult } from './hooks/useSession';
export { useExamCategories, type UseExamCategoriesOptions } from './hooks/useExamCategories';
export { useExamCategoryById } from './hooks/useExamCategoryById';
export { useExamById } from './hooks/useExamById';
export { useExamsList, type UseExamsListOptions } from './hooks/useExamsList';
