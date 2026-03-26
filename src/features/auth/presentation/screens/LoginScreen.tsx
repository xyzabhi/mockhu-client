import { AuthLayout } from '../components/AuthLayout';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

type LoginScreenProps = {
  onSwitchToSignUp: () => void;
  onPressPhone: () => void;
  onPressEmail: () => void;
};

export function LoginScreen({ onSwitchToSignUp, onPressPhone, onPressEmail }: LoginScreenProps) {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to continue your exam preparation journey"
    >
      <SocialAuthButtons
        switchCtaLabel="Create a new account"
        onSwitchMode={onSwitchToSignUp}
        onPressPhone={onPressPhone}
        onPressEmail={onPressEmail}
      />
    </AuthLayout>
  );
}
