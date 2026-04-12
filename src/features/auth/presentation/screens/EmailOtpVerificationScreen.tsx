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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppError, authApi } from '../../../../api';
import type { TokenResponse } from '../../../../api/types';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { BrandLogoAppOrRemote, BRAND_LOGO_ASPECT } from '../../../../shared/components/BrandLogo';
import { OtpInput } from '../../../../shared/components/OtpInput';

const RESEND_COOLDOWN_SEC = 45;

export type EmailOtpVerificationScreenProps = {
  mode: 'signup' | 'login';
  email: string;
  onBack: () => void;
  onVerified?: (tokens: TokenResponse) => void;
};

function verifyErrorMessage(e: unknown): string {
  if (e instanceof AppError) {
    if (e.status === 401) return 'Invalid or expired code';
    if (e.status != null && e.status >= 500) return 'Something went wrong. Try again.';
    return e.message;
  }
  return 'Invalid or expired code';
}

function requestErrorMessage(e: unknown): string {
  if (e instanceof AppError && e.status != null && e.status >= 500) {
    return 'Could not send the code. Try again in a moment.';
  }
  if (e instanceof AppError) return e.message;
  return 'Could not resend. Try again.';
}

export function EmailOtpVerificationScreen({
  mode: _mode,
  email,
  onBack,
  onVerified,
}: EmailOtpVerificationScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);

  const submittedForOtp = useRef<string | null>(null);
  const autoSubmitBlockedForOtp = useRef<string | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const title = 'Check your inbox';
  const subtitle = `We sent a 6-digit code to ${email}`;

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

  const handlePrimaryAction = useCallback(
    async (fromManual = false) => {
      if (isSubmitting || otp.length !== 6) return;
      if (fromManual) {
        autoSubmitBlockedForOtp.current = null;
        submittedForOtp.current = null;
      }
      setVerifyError(null);
      setIsSubmitting(true);
      try {
        const tokens = await authApi.verifyEmailOtp({ email, otp });
        onVerified?.(tokens);
      } catch (e) {
        setVerifyError(verifyErrorMessage(e));
        autoSubmitBlockedForOtp.current = otp;
        submittedForOtp.current = null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, otp, email, onVerified],
  );

  useEffect(() => {
    if (otp.length < 6) {
      submittedForOtp.current = null;
      autoSubmitBlockedForOtp.current = null;
      setVerifyError(null);
    }
  }, [otp]);

  useEffect(() => {
    if (otp.length !== 6 || isSubmitting) return;
    if (autoSubmitBlockedForOtp.current === otp) return;
    if (submittedForOtp.current === otp) return;
    submittedForOtp.current = otp;
    void handlePrimaryAction(false);
  }, [otp, isSubmitting, handlePrimaryAction]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resendBusy) return;
    setResendError(null);
    setVerifyError(null);
    setResendBusy(true);
    try {
      const res = await authApi.requestEmailOtp({ email });
      if (__DEV__ && res.otp != null && res.otp !== '') {
        console.log('[Mockhu dev] Email OTP (resend):', res.otp);
      }
      startCooldown();
    } catch (e) {
      setResendError(requestErrorMessage(e));
    } finally {
      setResendBusy(false);
    }
  }, [email, resendCooldown, resendBusy, startCooldown]);

  const inputDisabled = isSubmitting;
  const resendDisabled = resendCooldown > 0 || resendBusy;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: Math.max(insets.top, 12) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBlock}>
          <BrandLogoAppOrRemote style={styles.heroLogo} accessibilityLabel="Mockhu logo" />
        </View>

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Enter code</Text>
          <OtpInput value={otp} onChange={setOtp} disabled={inputDisabled} />
          {verifyError ? <Text style={styles.errorText}>{verifyError}</Text> : null}
          {resendError ? <Text style={styles.errorText}>{resendError}</Text> : null}

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
          style={({ pressed }) => [
            styles.primaryButton,
            (isSubmitting || otp.length !== 6) && styles.primaryButtonDisabled,
            pressed && !(isSubmitting || otp.length !== 6) && styles.primaryButtonPressed,
          ]}
          onPress={() => void handlePrimaryAction(true)}
          disabled={isSubmitting || otp.length !== 6}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting || otp.length !== 6 }}
        >
          <View style={styles.primaryButtonContent}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.onBrand} />
            ) : (
              <Text style={styles.primaryButtonText}>Verify</Text>
            )}
          </View>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: theme.spacing.screenPaddingH,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: 8,
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
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    headerContent: {
      marginTop: 8,
      marginBottom: 16,
    },
    backButton: {
      alignSelf: 'flex-start',
      width: 40,
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingVertical: 6,
      borderRadius: 8,
    },
    backButtonPressed: {
      opacity: 0.7,
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      lineHeight: 30,
      letterSpacing: -0.35,
      color: colors.textPrimary,
      textAlign: 'left',
      marginTop: 4,
    },
    subtitle: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'left',
      marginTop: 10,
      lineHeight: 22,
    },
    fieldBlock: {
      width: '100%',
      gap: 12,
    },
    label: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
    },
    resendBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 4,
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
      paddingVertical: 16,
      minHeight: 52,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonPressed: {
      opacity: 0.92,
    },
    primaryButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 8,
      minHeight: 24,
      justifyContent: 'center',
    },
    primaryButtonContainer: {
      paddingTop: 16,
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
