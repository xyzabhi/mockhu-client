import { AuthLayout } from '../components/AuthLayout';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

type LoginScreenProps = {
  onSwitchToSignUp: () => void;
  onPressPhone: () => void;
  onPressEmail: () => void;
  onPressGoogle?: () => void | Promise<void>;
  googleBusy?: boolean;
  googleErrorText?: string | null;
};

export function LoginScreen({
  onSwitchToSignUp,
  onPressPhone,
  onPressEmail,
  onPressGoogle,
  googleBusy,
  googleErrorText,
}: LoginScreenProps) {
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
        onPressGoogle={onPressGoogle}
        googleBusy={googleBusy}
        googleErrorText={googleErrorText}
      />
    </AuthLayout>
  );
}
