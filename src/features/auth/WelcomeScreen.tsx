import { useState } from 'react';
import { LoginScreen } from './presentation/screens/LoginScreen';
import { SignUpScreen } from './presentation/screens/SignUpScreen';

function WelcomeScreen() {
  const [isLoginMode, setIsLoginMode] = useState(false);

  if (isLoginMode) {
    return <LoginScreen onSwitchToSignUp={() => setIsLoginMode(false)} />;
  }

  return <SignUpScreen onSwitchToLogin={() => setIsLoginMode(true)} />;
}

export default WelcomeScreen;
