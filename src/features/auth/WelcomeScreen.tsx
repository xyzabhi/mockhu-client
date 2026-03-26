import { useState } from 'react';
import { AuthWithEmail } from './presentation/screens/AuthWithEmail';
import { AuthWithPhone } from './presentation/screens/AuthWithPhone';
import { LoginScreen } from './presentation/screens/LoginScreen';
import { SignUpScreen } from './presentation/screens/SignUpScreen';
import { PhoneVerificationScreen } from './presentation/screens/PhoneVerificationScreen';

type AuthEntryMode = 'signup' | 'login';
type AuthRoute = 'entry' | 'phone' | 'email' | 'phoneVerify';

function WelcomeScreen() {
  const [entryMode, setEntryMode] = useState<AuthEntryMode>('signup');
  const [route, setRoute] = useState<AuthRoute>('entry');

  if (route === 'phone') {
    return (
      <AuthWithPhone
        mode={entryMode}
        onBack={() => setRoute('entry')}
        onVerify={() => setRoute('phoneVerify')}
      />
    );
  }

  if (route === 'email') {
    return <AuthWithEmail mode={entryMode} onBack={() => setRoute('entry')} />;
  }

  if (route === 'phoneVerify') {
    return <PhoneVerificationScreen mode={entryMode} onBack={() => setRoute('phone')} />;
  }

  console.log('route', route);

  if (entryMode === 'login') {
    return (
      <LoginScreen
        onSwitchToSignUp={() => setEntryMode('signup')}
        onPressPhone={() => setRoute('phone')}
        onPressEmail={() => setRoute('email')}
      />
    );
  }

  return (
    <SignUpScreen
      onSwitchToLogin={() => setEntryMode('login')}
      onPressPhone={() => setRoute('phone')}
      onPressEmail={() => setRoute('email')}
    />
  );
}

export default WelcomeScreen;
