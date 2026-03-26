import { AuthLayout } from '../components/AuthLayout';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

type SignUpScreenProps = {
  onSwitchToLogin: () => void;
  onPressPhone: () => void;
  onPressEmail: () => void;
};

export function SignUpScreen({ onSwitchToLogin, onPressPhone, onPressEmail }: SignUpScreenProps) {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of students from around the world"
    >
      <SocialAuthButtons
        switchCtaLabel="Already have an account? Login"
        onSwitchMode={onSwitchToLogin}
        onPressPhone={onPressPhone}
        onPressEmail={onPressEmail}
      />
    </AuthLayout>
  );
}
