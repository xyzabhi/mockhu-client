import * as Application from 'expo-application';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { authApi } from '../../../api';
import type { TokenResponse } from '../../../api/types';
import { getGoogleAuthClientIdsForRequest, isGoogleAuthConfigured } from './googleAuthEnv';

/** Must match `expo.scheme` in app.json and Google Cloud Web client → Authorized redirect URIs. */
const GOOGLE_OAUTH_SCHEME =
  (typeof Constants.expoConfig?.scheme === 'string' && Constants.expoConfig.scheme) ||
  'com.mockhu.oauthios';

export type GoogleSignInState = {
  /** Call after user taps “Google” — opens ASWebAuthenticationSession, then POST `/auth/google`. */
  signInWithGoogle: () => Promise<TokenResponse>;
  /** True while the OAuth prompt or API call is in progress. */
  busy: boolean;
};

/**
 * Google Sign-In (authorization code) + Mockhu `POST /auth/google` with `{ code, redirect_uri, code_verifier? }`.
 * Does not exchange the code on-device; the backend validates and issues JWTs.
 * Wire OAuth client IDs in `.env` (see `googleAuthEnv.ts`).
 */
export function useGoogleSignIn(): GoogleSignInState {
  const [busy, setBusy] = useState(false);

  const ids = getGoogleAuthClientIdsForRequest();

  const redirectUri = useMemo(
    () =>
      makeRedirectUri({
        scheme: GOOGLE_OAUTH_SCHEME,
        path: 'oauth2redirect',
        native: `${Application.applicationId ?? GOOGLE_OAUTH_SCHEME}:/oauth2redirect`,
      }),
    [],
  );

  useEffect(() => {
    if (__DEV__) {
      console.log(
        '[Google OAuth] Add this exact redirect URI → Google Cloud → Web client → Authorized redirect URIs:',
        redirectUri,
      );
    }
  }, [redirectUri]);

  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: ids.webClientId,
    iosClientId: ids.iosClientId,
    androidClientId: ids.androidClientId,
    redirectUri,
    shouldAutoExchangeCode: false,
  });

  const signInWithGoogle = useCallback(async (): Promise<TokenResponse> => {
    if (!isGoogleAuthConfigured()) {
      throw new Error(
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and the iOS/Android client IDs in .env.',
      );
    }
    if (!request) {
      throw new Error('Google auth request is not ready yet. Try again in a moment.');
    }

    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        throw new Error('Google sign-in was cancelled or failed.');
      }

      const code = result.params.code;
      if (!code) {
        throw new Error('No authorization code from Google. Check your OAuth client and redirect URIs.');
      }

      return await authApi.google({
        code,
        redirect_uri: redirectUri,
        ...(request.codeVerifier ? { code_verifier: request.codeVerifier } : {}),
      });
    } finally {
      setBusy(false);
    }
  }, [request, promptAsync, redirectUri]);

  return { signInWithGoogle, busy };
}
