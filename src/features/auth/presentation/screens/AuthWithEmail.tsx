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
import type { TokenResponse } from '../../../../api/types';
import { theme } from '../../../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../../../presentation/theme/ThemeContext';

type AuthWithEmailProps = {
  mode: 'signup' | 'login';
  onBack: () => void;
  /** Called after tokens + user are persisted (navigate using `is_onboarded`). */
  onAuthSuccess?: (tokens: TokenResponse) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_RADIUS = 24;

export function AuthWithEmail({ mode, onBack, onAuthSuccess }: AuthWithEmailProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createAuthEmailStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailValid = useMemo(() => {
    const t = email.trim();
    return t.length > 0 && EMAIL_RE.test(t);
  }, [email]);

  const passwordChecks = useMemo(() => {
    const p = password;
    return {
      minLen: p.length >= 8,
    };
  }, [password]);

  /** Matches API: password min 8 (no extra client-only rules). */
  const signupPasswordValid = passwordChecks.minLen;

  const isFormValid =
    emailValid && (mode === 'login' ? password.length > 0 : signupPasswordValid);

  const title = mode === 'login' ? 'Login with Email' : 'Sign up with Email';
  const subtitle =
    mode === 'login'
      ? 'Sign in with your email and password.'
      : 'Create your account with your email and password.\nWe use your email for your account and recovery.';
  const primaryCta = mode === 'login' ? 'Login' : 'Continue';
  const primaryCtaDescription =
    mode === 'login' ? '' : 'We will send a link to your email to verify your account.';

  const handlePrimaryAction = async () => {
    if (!isFormValid || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const body = { email: email.trim(), password };
      const tokens =
        mode === 'login' ? await authApi.login(body) : await authApi.signup(body);
      onAuthSuccess?.(tokens);
    } catch (e) {
      const message =
        e instanceof AppError ? e.message : 'Something went wrong. Try again.';
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
            <MaterialCommunityIcons
              name="arrow-left"
              size={26}
              color={colors.textPrimary}
            />
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
              focusedField === 'email' ? styles.inputFocused : styles.inputIdle,
            ]}
            placeholder="Enter your email"
            placeholderTextColor={colors.textHint}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => setEmail(text.toLowerCase())}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Email address"
            textContentType="emailAddress"
            autoComplete="email"
          />

          <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              password.length > 0 ? styles.inputFilled : styles.inputDefault,
              focusedField === 'password' ? styles.inputFocused : styles.inputIdle,
            ]}
            placeholder="Enter your password"
            placeholderTextColor={colors.textHint}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Password"
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            autoComplete={mode === 'login' ? 'password' : 'password-new'}
          />

          {mode === 'signup' ? (
            <View style={styles.passwordHintCard}>
              <RequirementRow
                met={passwordChecks.minLen}
                text="At least 8 characters"
                colors={colors}
              />
              <Text style={styles.fieldHint}>
                You can use any mix of letters, numbers, and symbols. For a stronger password,
                include upper and lower case.
              </Text>
            </View>
          ) : (
            <View style={styles.forgotPasswordContainer}>
              <Pressable
                onPress={() => {}}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              >
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.primaryButtonContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {primaryCtaDescription ? (
          <View style={styles.primaryCtaDescRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.primaryCtaDesc}>{primaryCtaDescription}</Text>
          </View>
        ) : null}
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        <Pressable
          style={[
            styles.primaryButton,
            (!isFormValid || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={() => void handlePrimaryAction()}
          disabled={!isFormValid || isSubmitting}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isFormValid || isSubmitting }}
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

function RequirementRow({
  met,
  text,
  colors,
}: {
  met: boolean;
  text: string;
  colors: ThemeColors;
}) {
  return (
    <View style={requirementStyles.row}>
      <MaterialCommunityIcons
        name={met ? 'check-circle' : 'information-outline'}
        size={18}
        color={met ? colors.brand : colors.textMuted}
      />
      <Text style={[requirementStyles.text, { color: met ? colors.textPrimary : colors.textMuted }]}>
        {text}
      </Text>
    </View>
  );
}

const requirementStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    flex: 1,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
  },
});

function createAuthEmailStyles(colors: ThemeColors) {
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
    labelSpaced: {
      marginTop: 18,
    },
    fieldHint: {
      marginTop: 4,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      lineHeight: 18,
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
      borderWidth: 0,
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
    passwordHintCard: {
      marginTop: 14,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      gap: 10,
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
    primaryCtaDescRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 8,
      marginBottom: 14,
    },
    primaryCtaDesc: {
      flex: 1,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
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
    forgotPasswordContainer: {
      marginTop: 16,
      alignItems: 'flex-end',
    },
    forgotPasswordText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
  });
}
