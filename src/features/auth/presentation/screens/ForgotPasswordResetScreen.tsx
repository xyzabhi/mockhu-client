import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { TokenResponse } from '../../../../api/types';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { BrandLogoAppOrRemote, BRAND_LOGO_ASPECT } from '../../../../shared/components/BrandLogo';
import { OtpInput } from '../../../../shared/components/OtpInput';

const INPUT_RADIUS = 24;
const MIN_PASSWORD = 8;
const RESEND_COOLDOWN_SEC = 60;

export type ForgotPasswordResetScreenProps = {
  email: string;
  onBack: () => void;
  onResetSuccess: (tokens: TokenResponse) => void;
};

function resetErrorMessage(e: unknown): string {
  if (e instanceof AppError) {
    if (e.status === 401) return 'Invalid or expired code';
    if (e.status != null && e.status >= 500) return 'Something went wrong. Try again.';
    return e.message;
  }
  return 'Something went wrong. Try again.';
}

function forgotResendErrorMessage(e: unknown): string {
  if (e instanceof AppError && e.status != null && e.status >= 500) {
    return 'Could not resend. Try again in a moment.';
  }
  if (e instanceof AppError) return e.message;
  return 'Could not resend. Try again.';
}

export function ForgotPasswordResetScreen({
  email,
  onBack,
  onResetSuccess,
}: ForgotPasswordResetScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [focusedField, setFocusedField] = useState<'password' | 'confirm' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);

  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const passwordOk = password.length >= MIN_PASSWORD;
  const matchOk = password.length > 0 && password === confirm;
  const otpOk = otp.length === 6;
  const formValid = otpOk && passwordOk && matchOk;

  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
      cooldownTimer.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    clearCooldownTimer();
    setResendCooldown(RESEND_COOLDOWN_SEC);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearCooldownTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [clearCooldownTimer]);

  useEffect(() => {
    return () => {
      clearCooldownTimer();
    };
  }, [clearCooldownTimer]);

  /** Forgot was just sent from the previous screen — throttle resend to match API usage. */
  useEffect(() => {
    startCooldown();
  }, [startCooldown]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resendBusy) return;
    setResendError(null);
    setSubmitError(null);
    setResendBusy(true);
    try {
      const data = await authApi.forgotPassword({ email });
      if (__DEV__ && data.otp != null && data.otp !== '') {
        console.log('[Mockhu dev] Forgot password OTP (resend, dev only):', data.otp);
      }
      startCooldown();
    } catch (e) {
      setResendError(forgotResendErrorMessage(e));
    } finally {
      setResendBusy(false);
    }
  }, [email, resendCooldown, resendBusy, startCooldown]);

  const handlePrimaryAction = async () => {
    if (!formValid || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const tokens = await authApi.resetPassword({
        email,
        otp,
        new_password: password,
      });
      onResetSuccess(tokens);
    } catch (e) {
      setSubmitError(resetErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendDisabled = resendCooldown > 0 || resendBusy;
  const inputDisabled = isSubmitting;

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
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitleMuted}>{FORGOT_PASSWORD_PUBLIC_MESSAGE}</Text>
            <Text style={styles.subtitleEmail}>Code sent to {email}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Verification code</Text>
          <OtpInput value={otp} onChange={setOtp} disabled={inputDisabled} />

          <Text style={[styles.label, styles.labelSpaced]}>New password</Text>
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
            accessibilityLabel="New password"
            editable={!inputDisabled}
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
            editable={!inputDisabled}
          />

          {confirm.length > 0 && !matchOk ? (
            <Text style={styles.fieldError}>Passwords do not match</Text>
          ) : null}
          {password.length > 0 && !passwordOk ? (
            <Text style={styles.fieldError}>Use at least {MIN_PASSWORD} characters</Text>
          ) : null}

          {submitError ? <Text style={styles.fieldError}>{submitError}</Text> : null}
          {resendError ? <Text style={styles.fieldError}>{resendError}</Text> : null}

          <Pressable
            onPress={() => void handleResend()}
            disabled={resendDisabled}
            style={({ pressed }) => [
              styles.resendBtn,
              resendDisabled && styles.resendBtnDisabled,
              pressed && !resendDisabled && styles.resendBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              resendCooldown > 0 ? `Resend code in ${resendCooldown} seconds` : 'Resend code'
            }
          >
            {resendBusy ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <Text style={[styles.resendText, resendDisabled && styles.resendTextDisabled]}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.primaryButtonContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
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
          accessibilityLabel="Reset password"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onBrand} />
          ) : (
            <Text style={styles.primaryButtonText}>Reset password</Text>
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
      marginBottom: 16,
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
    subtitleMuted: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'left',
      marginTop: 10,
      lineHeight: 22,
    },
    subtitleEmail: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      textAlign: 'left',
      marginTop: 8,
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
    resendBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginTop: 4,
    },
    resendBtnDisabled: {
      opacity: 0.55,
    },
    resendBtnPressed: {
      opacity: 0.85,
    },
    resendText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
    resendTextDisabled: {
      color: colors.textMuted,
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
    primaryButtonText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
    },
  });
}
