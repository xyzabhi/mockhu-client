import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppError, authApi, FORGOT_PASSWORD_PUBLIC_MESSAGE } from '../../../../api';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { BrandLogoAppOrRemote, BRAND_LOGO_ASPECT } from '../../../../shared/components/BrandLogo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INPUT_RADIUS = 24;

export type ForgotPasswordEmailScreenProps = {
  /** Pre-filled when user chose “Recover account” from duplicate-email sign-up. */
  initialEmail?: string;
  onBack: () => void;
  /** After user acknowledges “Check your email” — same message whether or not the account exists. */
  onContinueToReset: (email: string) => void;
};

type Phase = 'enterEmail' | 'checkEmail';

export function ForgotPasswordEmailScreen({
  initialEmail = '',
  onBack,
  onContinueToReset,
}: ForgotPasswordEmailScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('enterEmail');
  const [email, setEmail] = useState(initialEmail);
  const [focusedField, setFocusedField] = useState<'email' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const emailValid = useMemo(() => {
    const t = email.trim().toLowerCase();
    return t.length > 0 && EMAIL_RE.test(t);
  }, [email]);

  const handleSendForgot = async () => {
    if (!emailValid || isSubmitting) return;
    const normalized = email.trim().toLowerCase();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const data = await authApi.forgotPassword({ email: normalized });
      if (__DEV__ && data.otp != null && data.otp !== '') {
        console.log('[Mockhu dev] Forgot password OTP (dev only):', data.otp);
      }
      setPhase('checkEmail');
    } catch (e) {
      const message =
        e instanceof AppError && e.status != null && e.status >= 500
          ? 'Could not send instructions. Try again in a moment.'
          : e instanceof AppError
            ? e.message
            : 'Something went wrong. Try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    onContinueToReset(email.trim().toLowerCase());
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: Math.max(insets.top, 12) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBlock}>
          <BrandLogoAppOrRemote
            style={styles.heroLogo}
            accessibilityLabel="Mockhu logo"
          />
        </View>

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.title}>
              {phase === 'enterEmail' ? 'Forgot password' : 'Check your email'}
            </Text>
            <Text style={styles.subtitle}>
              {phase === 'enterEmail'
                ? 'Enter your account email. We will send a verification code if an account with a password exists.'
                : FORGOT_PASSWORD_PUBLIC_MESSAGE}
            </Text>
          </View>
        </View>

        {phase === 'enterEmail' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                email.length > 0 ? styles.inputFilled : styles.inputDefault,
                focusedField === 'email' ? styles.inputFocused : styles.inputIdle,
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textHint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => setEmail(t.toLowerCase())}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Email address"
              textContentType="emailAddress"
              autoComplete="email"
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.primaryButtonContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        {phase === 'enterEmail' ? (
          <Pressable
            style={[
              styles.primaryButton,
              (!emailValid || isSubmitting) && styles.primaryButtonDisabled,
            ]}
            onPress={() => void handleSendForgot()}
            disabled={!emailValid || isSubmitting}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            accessibilityRole="button"
            accessibilityState={{ disabled: !emailValid || isSubmitting }}
            accessibilityLabel="Send reset code"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.onBrand} />
            ) : (
              <Text style={styles.primaryButtonText}>Send code</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={handleContinue}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            accessibilityRole="button"
            accessibilityLabel="Continue to enter code and new password"
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  const inputShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  });

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: theme.spacing.screenPaddingH,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    logoBlock: {
      alignItems: 'center',
      marginBottom: 8,
    },
    heroLogo: {
      height: 72,
      aspectRatio: BRAND_LOGO_ASPECT,
      maxWidth: '100%',
      alignSelf: 'center',
    },
    header: {
      marginBottom: 24,
      alignItems: 'flex-start',
    },
    headerContent: {
      width: '100%',
      marginTop: 8,
    },
    backButton: {
      alignSelf: 'flex-start',
      width: 44,
      minHeight: 44,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      lineHeight: 30,
      letterSpacing: -0.35,
      color: colors.textPrimary,
      textAlign: 'left',
    },
    subtitle: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'left',
      marginTop: 10,
      lineHeight: 22,
      maxWidth: 400,
    },
    form: {
      width: '100%',
    },
    label: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      letterSpacing: -0.1,
    },
    input: {
      minHeight: 52,
      marginTop: 8,
      borderRadius: INPUT_RADIUS,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    inputIdle: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
      ...inputShadow,
    },
    inputFocused: {
      borderWidth: 2,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
    },
    inputDefault: {
      fontFamily: theme.typography.regular,
    },
    inputFilled: {
      fontFamily: theme.typography.semiBold,
    },
    primaryButton: {
      borderRadius: 999,
      backgroundColor: colors.brand,
      borderWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      minHeight: 52,
    },
    primaryButtonDisabled: {
      opacity: 0.42,
    },
    primaryButtonContainer: {
      paddingTop: 8,
      backgroundColor: colors.surfaceSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      marginBottom: 12,
    },
    primaryButtonText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
    },
  });
}
