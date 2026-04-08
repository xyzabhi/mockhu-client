import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EmailOtpRequestScreen } from '../features/auth/presentation/screens/EmailOtpRequestScreen';
import { EmailOtpVerificationScreen } from '../features/auth/presentation/screens/EmailOtpVerificationScreen';
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
  return (
    <SignUpScreen
      onSwitchToLogin={() => navigation.navigate('AuthLogin')}
      onPressPhone={() => navigation.navigate('AuthPhone', { mode: 'signup' })}
      onPressEmail={() => navigation.navigate('AuthEmail', { mode: 'signup' })}
    />
  );
}

function LoginScreenNav({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'AuthLogin'>) {
  return (
    <LoginScreen
      onSwitchToSignUp={() => navigation.navigate('AuthSignUp')}
      onPressPhone={() => navigation.navigate('AuthPhone', { mode: 'login' })}
      onPressEmail={() => navigation.navigate('AuthEmail', { mode: 'login' })}
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
  return (
    <EmailOtpRequestScreen
      mode={mode}
      onBack={() => navigation.goBack()}
      onCodeSent={(email) => navigation.navigate('AuthEmailVerify', { mode, email })}
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
    </Stack.Navigator>
  );
}
