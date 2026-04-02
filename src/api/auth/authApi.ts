import { apiPost } from '../apiClient';
import * as sessionStore from '../sessionStore';
import type { TokenResponse } from '../types';
import type {
  GoogleAuthBody,
  LoginBody,
  PhoneOtpRequestData,
  PhoneRequestBody,
  PhoneVerifyBody,
  SignupBody,
} from './types';

const authOpts = { skipAuth: true } as const;

async function persistTokens(data: TokenResponse): Promise<TokenResponse> {
  await sessionStore.saveTokenResponse(data);
  return data;
}

export async function signup(body: SignupBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/signup', body, authOpts);
  return persistTokens(data);
}

export async function login(body: LoginBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/login', body, authOpts);
  return persistTokens(data);
}

export async function requestPhoneOtp(body: PhoneRequestBody): Promise<PhoneOtpRequestData> {
  return apiPost<PhoneOtpRequestData>('/auth/phone/request', body, authOpts);
}

export async function verifyPhoneOtp(body: PhoneVerifyBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/phone/verify', body, authOpts);
  return persistTokens(data);
}

export async function google(body: GoogleAuthBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/google', body, authOpts);
  return persistTokens(data);
}

/**
 * Refresh is also performed internally by `refreshCoordinator` (same contract).
 * Exposed for proactive refresh if needed.
 */
export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>(
    '/auth/refresh',
    { refresh_token: refreshToken },
    authOpts,
  );
  return persistTokens(data);
}

export const authApi = {
  signup,
  login,
  requestPhoneOtp,
  verifyPhoneOtp,
  google,
  refresh,
};
