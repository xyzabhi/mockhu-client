import { AuthLayout } from '../components/AuthLayout';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

type SignUpScreenProps = {
  onSwitchToLogin: () => void;
  onPressEmail: () => void;
  onPressGoogle?: () => void | Promise<void>;
  googleBusy?: boolean;
  googleErrorText?: string | null;
};

export function SignUpScreen({
  onSwitchToLogin,
  onPressEmail,
  onPressGoogle,
  googleBusy,
  googleErrorText,
}: SignUpScreenProps) {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of students from around the world"
    >
      <SocialAuthButtons
        switchCtaLabel="Already have an account? Login"
        onSwitchMode={onSwitchToLogin}
        onPressEmail={onPressEmail}
        onPressGoogle={onPressGoogle}
        googleBusy={googleBusy}
        googleErrorText={googleErrorText}
      />
    </AuthLayout>
  );
}
