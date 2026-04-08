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
import {
  AppError,
  authApi,
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  EMAIL_ALREADY_REGISTERED_MODAL_BODY,
  isEmailAlreadyRegisteredError,
} from '../../../../api';
import type { TokenResponse } from '../../../../api/types';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { BrandLogoAppOrRemote, BRAND_LOGO_ASPECT } from '../../../../shared/components/BrandLogo';
import { useMessageModal } from '../../../../shared/components/MessageModal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INPUT_RADIUS = 24;
const MIN_PASSWORD = 8;

export type EmailOtpRequestScreenProps =
  | {
      mode: 'signup';
      onBack: () => void;
      onCodeSent: (email: string) => void;
      /** When sign-up hits “email already registered” — opens recovery with this email prefilled. */
      onRecoverAccount?: (email: string) => void;
    }
  | {
      mode: 'login';
      onBack: () => void;
      onLoggedIn: (tokens: TokenResponse) => void;
    };

export function EmailOtpRequestScreen(props: EmailOtpRequestScreenProps) {
  const mode = props.mode;
  const onBack = props.onBack;
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { modal: messageModal, show: showMessageModal, hide: hideMessageModal } = useMessageModal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'confirm' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailValid = useMemo(() => {
    const t = email.trim().toLowerCase();
    return t.length > 0 && EMAIL_RE.test(t);
  }, [email]);

  const passwordOk = password.length >= MIN_PASSWORD;
  const matchOk = password.length > 0 && password === confirm;
  const loginFormValid = emailValid && password.length > 0;
  const signupFormValid = emailValid && passwordOk && matchOk;
  const formValid = mode === 'signup' ? signupFormValid : loginFormValid;

  const title = mode === 'login' ? 'Login with Email' : 'Sign up with Email';
  const subtitle =
    mode === 'login'
      ? 'Enter your email and password to sign in.'
      : 'Create your account, then we will email a 6-digit code to verify it.';
  const primaryCta = mode === 'login' ? 'Log in' : 'Sign up';

  const handlePrimaryAction = async () => {
    if (!formValid || isSubmitting) return;
    const normalized = email.trim().toLowerCase();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const tokens = await authApi.login({ email: normalized, password });
        props.onLoggedIn(tokens);
        return;
      }

      await authApi.registerSignup({ email: normalized, password });
      const res = await authApi.requestEmailOtp({ email: normalized });
      if (__DEV__ && res.otp != null && res.otp !== '') {
        console.log('[Mockhu dev] Email OTP (from API):', res.otp);
      }
      props.onCodeSent(normalized);
    } catch (e) {
      if (mode === 'login') {
        const message =
          e instanceof AppError && e.status != null && e.status >= 500
            ? 'Could not sign in. Try again in a moment.'
            : e instanceof AppError
              ? e.message
              : 'Could not sign in. Try again.';
        setSubmitError(message);
        return;
      }

      if (isEmailAlreadyRegisteredError(e)) {
        setSubmitError(EMAIL_ALREADY_REGISTERED_MESSAGE);
        const emailForRecovery = normalized;
        showMessageModal({
          title: 'Email already in use',
          message: EMAIL_ALREADY_REGISTERED_MODAL_BODY,
          dismissOnBackdropPress: false,
          buttons: [
            {
              label: 'New email address',
              variant: 'secondary',
              onPress: () => {
                hideMessageModal();
                setEmail('');
                setPassword('');
                setConfirm('');
                setSubmitError(null);
              },
            },
            {
              label: 'Recover account',
              variant: 'primary',
              onPress: () => {
                hideMessageModal();
                props.onRecoverAccount?.(emailForRecovery);
              },
            },
          ],
        });
        return;
      }
      const genericSignup = 'Could not create your account. Try again in a moment.';
      const message =
        e instanceof AppError && e.status != null && e.status >= 500
          ? genericSignup
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

          {mode === 'signup' ? (
            <>
              <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  password.length > 0 ? styles.inputFilled : styles.inputDefault,
                  focusedField === 'password' ? styles.inputFocused : styles.inputIdle,
                ]}
                placeholder={`At least ${MIN_PASSWORD} characters`}
                placeholderTextColor={colors.textHint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                textContentType="newPassword"
                autoComplete="password-new"
                accessibilityLabel="Password"
              />
              <Text style={[styles.label, styles.labelSpaced]}>Confirm password</Text>
              <TextInput
                style={[
                  styles.input,
                  confirm.length > 0 ? styles.inputFilled : styles.inputDefault,
                  focusedField === 'confirm' ? styles.inputFocused : styles.inputIdle,
                ]}
                placeholder="Re-enter password"
                placeholderTextColor={colors.textHint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={confirm}
                onChangeText={setConfirm}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                textContentType="newPassword"
                autoComplete="password-new"
                accessibilityLabel="Confirm password"
              />
              {confirm.length > 0 && !matchOk ? (
                <Text style={styles.fieldError}>Passwords do not match</Text>
              ) : null}
              {password.length > 0 && !passwordOk ? (
                <Text style={styles.fieldError}>Use at least {MIN_PASSWORD} characters</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  password.length > 0 ? styles.inputFilled : styles.inputDefault,
                  focusedField === 'password' ? styles.inputFocused : styles.inputIdle,
                ]}
                placeholder="Your password"
                placeholderTextColor={colors.textHint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                textContentType="password"
                autoComplete="password"
                accessibilityLabel="Password"
              />
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.primaryButtonContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        <Pressable
          style={[
            styles.primaryButton,
            (!formValid || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={() => void handlePrimaryAction()}
          disabled={!formValid || isSubmitting}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          accessibilityRole="button"
          accessibilityState={{ disabled: !formValid || isSubmitting }}
          accessibilityLabel={primaryCta}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onBrand} />
          ) : (
            <Text style={styles.primaryButtonText}>{primaryCta}</Text>
          )}
        </Pressable>
      </View>
      {mode === 'signup' ? messageModal : null}
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
    labelSpaced: {
      marginTop: 14,
    },
    fieldError: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
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
