import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { isGoogleAuthConfigured, useGoogleSignIn } from '../features/auth/google';
import { EmailOtpRequestScreen } from '../features/auth/presentation/screens/EmailOtpRequestScreen';
import { EmailOtpVerificationScreen } from '../features/auth/presentation/screens/EmailOtpVerificationScreen';
import { ForgotPasswordEmailScreen } from '../features/auth/presentation/screens/ForgotPasswordEmailScreen';
import { ForgotPasswordResetScreen } from '../features/auth/presentation/screens/ForgotPasswordResetScreen';
import { AuthWithPhone } from '../features/auth/presentation/screens/AuthWithPhone';
import { LoginScreen } from '../features/auth/presentation/screens/LoginScreen';
import { PhoneVerificationScreen } from '../features/auth/presentation/screens/PhoneVerificationScreen';
import { SignUpScreen } from '../features/auth/presentation/screens/SignUpScreen';
import { resetToRootAfterAuth } from './postAuthNavigation';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function SignUpScreenNav({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'AuthSignUp'>) {
  const { signInWithGoogle, busy: googleBusy } = useGoogleSignIn();
  const onPressGoogle = useCallback(async () => {
    if (!isGoogleAuthConfigured()) {
      Alert.alert(
        'Google Sign-In',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and the iOS/Android client IDs to your .env file.',
      );
      return;
    }
    try {
      const tokens = await signInWithGoogle();
      resetToRootAfterAuth(tokens);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed.';
      Alert.alert('Google Sign-In', msg);
    }
  }, [signInWithGoogle]);

  return (
    <SignUpScreen
      onSwitchToLogin={() => navigation.navigate('AuthLogin')}
      onPressPhone={() => navigation.navigate('AuthPhone', { mode: 'signup' })}
      onPressEmail={() => navigation.navigate('AuthEmail', { mode: 'signup' })}
      onPressGoogle={onPressGoogle}
      googleBusy={googleBusy}
    />
  );
}

function LoginScreenNav({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'AuthLogin'>) {
  const { signInWithGoogle, busy: googleBusy } = useGoogleSignIn();
  const onPressGoogle = useCallback(async () => {
    if (!isGoogleAuthConfigured()) {
      Alert.alert(
        'Google Sign-In',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and the iOS/Android client IDs to your .env file.',
      );
      return;
    }
    try {
      const tokens = await signInWithGoogle();
      resetToRootAfterAuth(tokens);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed.';
      Alert.alert('Google Sign-In', msg);
    }
  }, [signInWithGoogle]);

  return (
    <LoginScreen
      onSwitchToSignUp={() => navigation.navigate('AuthSignUp')}
      onPressPhone={() => navigation.navigate('AuthPhone', { mode: 'login' })}
      onPressEmail={() => navigation.navigate('AuthEmail', { mode: 'login' })}
      onPressGoogle={onPressGoogle}
      googleBusy={googleBusy}
    />
  );
}

function AuthPhoneNav({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'AuthPhone'>) {
  const { mode } = route.params;
  return (
    <AuthWithPhone
      mode={mode}
      onBack={() => navigation.goBack()}
      onVerify={(phoneE164) =>
        navigation.navigate('AuthPhoneVerify', { mode, phoneE164 })
      }
    />
  );
}

function AuthEmailNav({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'AuthEmail'>) {
  const { mode } = route.params;
  if (mode === 'login') {
    return (
      <EmailOtpRequestScreen
        mode="login"
        onBack={() => navigation.goBack()}
        onLoggedIn={(tokens) => resetToRootAfterAuth(tokens)}
      />
    );
  }
  return (
    <EmailOtpRequestScreen
      mode="signup"
      onBack={() => navigation.goBack()}
      onCodeSent={(email) => navigation.navigate('AuthEmailVerify', { mode: 'signup', email })}
      onRecoverAccount={(email) =>
        navigation.navigate('AuthForgotPasswordEmail', { prefilledEmail: email })
      }
    />
  );
}

function AuthEmailVerifyNav({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'AuthEmailVerify'>) {
  const { mode, email } = route.params;
  return (
    <EmailOtpVerificationScreen
      mode={mode}
      email={email}
      onBack={() => navigation.goBack()}
      onVerified={(tokens) => resetToRootAfterAuth(tokens)}
    />
  );
}

function AuthPhoneVerifyNav({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'AuthPhoneVerify'>) {
  const { mode, phoneE164 } = route.params;
  return (
    <PhoneVerificationScreen
      mode={mode}
      phoneE164={phoneE164}
      onBack={() => navigation.goBack()}
      onVerified={(tokens) => resetToRootAfterAuth(tokens)}
    />
  );
}

function AuthForgotPasswordEmailNav({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'AuthForgotPasswordEmail'>) {
  const prefilledEmail = route.params?.prefilledEmail ?? '';
  return (
    <ForgotPasswordEmailScreen
      initialEmail={prefilledEmail}
      onBack={() => navigation.goBack()}
      onContinueToReset={(email) => navigation.navigate('AuthForgotPasswordReset', { email })}
    />
  );
}

function AuthForgotPasswordResetNav({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'AuthForgotPasswordReset'>) {
  const { email } = route.params;
  return (
    <ForgotPasswordResetScreen
      email={email}
      onBack={() => navigation.goBack()}
      onResetSuccess={(tokens) => resetToRootAfterAuth(tokens)}
    />
  );
}

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AuthSignUp"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="AuthSignUp" component={SignUpScreenNav} />
      <Stack.Screen name="AuthLogin" component={LoginScreenNav} />
      <Stack.Screen name="AuthPhone" component={AuthPhoneNav} />
      <Stack.Screen name="AuthEmail" component={AuthEmailNav} />
      <Stack.Screen name="AuthEmailVerify" component={AuthEmailVerifyNav} />
      <Stack.Screen name="AuthPhoneVerify" component={AuthPhoneVerifyNav} />
      <Stack.Screen name="AuthForgotPasswordEmail" component={AuthForgotPasswordEmailNav} />
      <Stack.Screen name="AuthForgotPasswordReset" component={AuthForgotPasswordResetNav} />
    </Stack.Navigator>
  );
}
