import { AuthLayout } from '../components/AuthLayout';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

type SignUpScreenProps = {
  onSwitchToLogin: () => void;
};

export function SignUpScreen({ onSwitchToLogin }: SignUpScreenProps) {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of students from around the world"
    >
      <SocialAuthButtons
        switchCtaLabel="Already have an account? Login"
        onSwitchMode={onSwitchToLogin}
      />
    </AuthLayout>
  );
}
