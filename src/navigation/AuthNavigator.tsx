import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useGoogleSignIn } from '../features/auth/google';
import { EmailOtpRequestScreen } from '../features/auth/presentation/screens/EmailOtpRequestScreen';
import { EmailOtpVerificationScreen } from '../features/auth/presentation/screens/EmailOtpVerificationScreen';
import { ForgotPasswordEmailScreen } from '../features/auth/presentation/screens/ForgotPasswordEmailScreen';
import { ForgotPasswordResetScreen } from '../features/auth/presentation/screens/ForgotPasswordResetScreen';
import { LoginScreen } from '../features/auth/presentation/screens/LoginScreen';
import { SignUpScreen } from '../features/auth/presentation/screens/SignUpScreen';
import { resetToRootAfterAuth } from './postAuthNavigation';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function SignUpScreenNav({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'AuthSignUp'>) {
  const { signInWithGoogle, busy: googleBusy, errorText: googleErrorText } = useGoogleSignIn();
  return (
    <SignUpScreen
      onSwitchToLogin={() => navigation.navigate('AuthLogin')}
      onPressEmail={() => navigation.navigate('AuthEmail', { mode: 'signup' })}
      onPressGoogle={signInWithGoogle}
      googleBusy={googleBusy}
      googleErrorText={googleErrorText}
    />
  );
}

function LoginScreenNav({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'AuthLogin'>) {
  const { signInWithGoogle, busy: googleBusy, errorText: googleErrorText } = useGoogleSignIn();
  return (
    <LoginScreen
      onSwitchToSignUp={() => navigation.navigate('AuthSignUp')}
      onPressEmail={() => navigation.navigate('AuthEmail', { mode: 'login' })}
      onPressGoogle={signInWithGoogle}
      googleBusy={googleBusy}
      googleErrorText={googleErrorText}
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
        onForgotPassword={(prefilledEmail) =>
          navigation.navigate('AuthForgotPasswordEmail', {
            prefilledEmail: prefilledEmail.length > 0 ? prefilledEmail : undefined,
          })
        }
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
      <Stack.Screen name="AuthEmail" component={AuthEmailNav} />
      <Stack.Screen name="AuthEmailVerify" component={AuthEmailVerifyNav} />
      <Stack.Screen name="AuthForgotPasswordEmail" component={AuthForgotPasswordEmailNav} />
      <Stack.Screen name="AuthForgotPasswordReset" component={AuthForgotPasswordResetNav} />
    </Stack.Navigator>
  );
}
