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
export { getHealth } from './health';
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

export { useSession, type UseSessionResult } from './hooks/useSession';
