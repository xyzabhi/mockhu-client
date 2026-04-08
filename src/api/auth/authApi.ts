import { apiPost } from '../apiClient';
import { hydrateSessionUserFromMe } from '../hydrateSessionProfile';
import * as sessionStore from '../sessionStore';
import type { TokenResponse } from '../types';
import type {
  EmailOtpRequestBody,
  EmailOtpRequestData,
  EmailOtpVerifyBody,
  ForgotPasswordBody,
  ForgotPasswordData,
  GoogleSignInBody,
  LoginBody,
  PhoneOtpRequestData,
  PhoneRequestBody,
  PhoneVerifyBody,
  ResetPasswordBody,
  SignupBody,
} from './types';

const authOpts = { skipAuth: true } as const;

async function persistTokens(
  data: TokenResponse,
  opts?: { log?: boolean },
): Promise<TokenResponse> {
  await sessionStore.saveTokenResponse(data);
  await hydrateSessionUserFromMe();
  if (opts?.log !== false) {
    sessionStore.logSessionSnapshot('auth');
  }
  return data;
}

export async function signup(body: SignupBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/signup', body, authOpts);
  return persistTokens(data);
}

/**
 * `POST /auth/signup` — creates the account only; does **not** persist tokens.
 * Use in the email sign-up flow, then call `requestEmailOtp({ email })` to send the verification code.
 */
export async function registerSignup(body: SignupBody): Promise<void> {
  await apiPost<unknown>('/auth/signup', body, authOpts);
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

/** Request OTP email. Sign-up: call `registerSignup` first, then this with `{ email }` only. */
export async function requestEmailOtp(body: EmailOtpRequestBody): Promise<EmailOtpRequestData> {
  return apiPost<EmailOtpRequestData>('/auth/email/request', body, authOpts);
}

export async function verifyEmailOtp(body: EmailOtpVerifyBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/email/verify', body, authOpts);
  return persistTokens(data);
}

/** `POST /auth/google` — server verifies `id_token` with Google and returns Mockhu session tokens. */
export async function signInWithGoogle(body: GoogleSignInBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/google', body, authOpts);
  return persistTokens(data);
}

/** `POST /auth/password/forgot` — triggers email with 6-digit code (public message in response). */
export async function forgotPassword(body: ForgotPasswordBody): Promise<ForgotPasswordData> {
  return apiPost<ForgotPasswordData>('/auth/password/forgot', body, authOpts);
}

/** `POST /auth/password/reset` — `{ email, otp, new_password }`; persists session on success. */
export async function resetPassword(body: ResetPasswordBody): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/password/reset', body, authOpts);
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
  return persistTokens(data, { log: false });
}

export const authApi = {
  signup,
  registerSignup,
  login,
  requestPhoneOtp,
  verifyPhoneOtp,
  requestEmailOtp,
  verifyEmailOtp,
  signInWithGoogle,
  forgotPassword,
  resetPassword,
  refresh,
};
