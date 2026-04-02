/** Standard success envelope from shared response helpers */
export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | string;

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
};

/** Standard failure envelope */
export type ApiFailureEnvelope = {
  success: false;
  error: ApiErrorBody;
};

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiFailureEnvelope;

export type TokenUser = {
  id: string;
  is_onboarded: boolean;
};

/** Returned inside `data` for token-issuing auth endpoints */
export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: TokenUser;
};
