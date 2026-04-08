import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
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
import { AppError, authApi } from '../../../../api';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INPUT_RADIUS = 24;

type EmailOtpRequestScreenProps = {
  mode: 'signup' | 'login';
  onBack: () => void;
  onCodeSent: (email: string) => void;
};

export function EmailOtpRequestScreen({ mode, onBack, onCodeSent }: EmailOtpRequestScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailValid = useMemo(() => {
    const t = email.trim().toLowerCase();
    return t.length > 0 && EMAIL_RE.test(t);
  }, [email]);

  const title = mode === 'login' ? 'Login with Email' : 'Sign up with Email';
  const subtitle =
    mode === 'login'
      ? 'We will email you a one-time code to sign in — no password needed.'
      : 'Enter your email. We will send a 6-digit code to verify it.';
  const primaryCta = mode === 'login' ? 'Continue' : 'Send code';

  const handlePrimaryAction = async () => {
    if (!emailValid || isSubmitting) return;
    const normalized = email.trim().toLowerCase();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await authApi.requestEmailOtp({ email: normalized });
      if (__DEV__ && res.otp != null && res.otp !== '') {
        console.log('[Mockhu dev] Email OTP (from API):', res.otp);
      }
      onCodeSent(normalized);
    } catch (e) {
      const message =
        e instanceof AppError && e.status != null && e.status >= 500
          ? 'Could not send the code. Try again in a moment.'
          : e instanceof AppError
            ? e.message
            : 'Something went wrong. Try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              email.length > 0 ? styles.inputFilled : styles.inputDefault,
              focusedField ? styles.inputFocused : styles.inputIdle,
            ]}
            placeholder="you@example.com"
            placeholderTextColor={colors.textHint}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(t) => setEmail(t.toLowerCase())}
            onFocus={() => setFocusedField(true)}
            onBlur={() => setFocusedField(false)}
            accessibilityLabel="Email address"
            textContentType="emailAddress"
            autoComplete="email"
          />
        </View>
      </ScrollView>

      <View style={[styles.primaryButtonContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        <Pressable
          style={[
            styles.primaryButton,
            (!emailValid || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={() => void handlePrimaryAction()}
          disabled={!emailValid || isSubmitting}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          accessibilityRole="button"
          accessibilityState={{ disabled: !emailValid || isSubmitting }}
          accessibilityLabel={primaryCta}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onBrand} />
          ) : (
            <Text style={styles.primaryButtonText}>{primaryCta}</Text>
          )}
        </Pressable>
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
