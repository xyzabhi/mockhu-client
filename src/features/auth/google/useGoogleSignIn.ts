import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { authApi } from '../../../api';
import { resetToRootAfterAuth } from '../../../navigation/postAuthNavigation';
import { getGoogleIosClientId, getGoogleWebClientId, isMockhuGoogleAuthEnabled } from './googleSignInEnv';

export type GoogleSignInState = {
  busy: boolean;
  errorText: string | null;
  signInWithGoogle: () => Promise<void>;
};

function formatError(err: unknown): string {
  if (err == null) return 'Google sign-in failed';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Native Google Sign-In (`@react-native-google-signin/google-signin`, dev build required).
 * Sends `{ id_token }` to `POST /api/v1/auth/google` — same contract as Expo AuthSession + PKCE;
 * the backend only needs the JWT (verified via JWKS). Set `EXPO_PUBLIC_MOCKHU_GOOGLE_AUTH=1` to call the API.
 */
export function useGoogleSignIn(): GoogleSignInState {
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const configuredRef = useRef(false);

  useEffect(() => {
    const webClientId = getGoogleWebClientId();
    const iosClientId = getGoogleIosClientId();
    if (!webClientId) return;

    GoogleSignin.configure({
      webClientId,
      ...(Platform.OS === 'ios' && iosClientId ? { iosClientId } : {}),
      scopes: ['openid', 'profile', 'email'],
    });
    configuredRef.current = true;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setErrorText(null);

    if (Platform.OS === 'web') {
      setErrorText('Google Sign-In is not available on web in this app.');
      return;
    }

    if (Constants.appOwnership === 'expo') {
      setErrorText('Google Sign-In requires a development build (not Expo Go).');
      return;
    }

    const webClientId = getGoogleWebClientId();
    if (!webClientId) {
      setErrorText(
        'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (or EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID) in .env',
      );
      return;
    }

    if (Platform.OS === 'ios' && !getGoogleIosClientId()) {
      setErrorText('Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env.');
      return;
    }

    if (!configuredRef.current) {
      GoogleSignin.configure({
        webClientId,
        ...(Platform.OS === 'ios' && getGoogleIosClientId()
          ? { iosClientId: getGoogleIosClientId() }
          : {}),
        scopes: ['openid', 'profile', 'email'],
      });
      configuredRef.current = true;
    }

    setBusy(true);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        // Without this, Android often reuses the last account and skips the account picker UI.
        try {
          await GoogleSignin.signOut();
        } catch {
          /* no prior Google session */
        }
      }

      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') {
        setBusy(false);
        return;
      }

      const data = response.data;

      if (!isMockhuGoogleAuthEnabled()) {
        console.log('[GoogleSignIn] user (no backend):', JSON.stringify(data.user, null, 2));
        console.log('[GoogleSignIn] scopes:', data.scopes);
        return;
      }

      let idToken = data.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) {
        setErrorText('Google did not return an ID token. Check Web client ID in .env and Google Cloud.');
        return;
      }

      const tokens = await authApi.signInWithGoogle({ id_token: idToken });
      resetToRootAfterAuth(tokens);
    } catch (e: unknown) {
      const code = typeof e === 'object' && e !== null && 'code' in e ? (e as { code: string }).code : '';
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        setErrorText(null);
      } else {
        setErrorText(formatError(e));
      }
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, errorText, signInWithGoogle };
}
