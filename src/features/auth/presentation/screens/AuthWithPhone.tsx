import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
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

type AuthWithPhoneProps = {
  mode: 'signup' | 'login';
  onBack: () => void;
  /** E.164 phone used for OTP request; passed through to verify screen. */
  onVerify: (phoneE164: string) => void;
};

function createAuthPhoneStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 16,
    },
    header: {
      marginBottom: 20,
      alignItems: 'flex-start',
    },
    headerContent: {
      width: '100%',
      marginTop: 12,
    },
    backButton: {
      alignSelf: 'flex-start',
      width: 40,
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingVertical: 6,
    },
    title: {
      fontFamily: theme.typography.bold,
      fontSize: theme.fintSizes.xxl,
      color: colors.textPrimary,
      textAlign: 'left',
    },
    subtitle: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'left',
      marginTop: 8,
      lineHeight: 20,
    },
    form: {
      width: '100%',
    },
    fieldHint: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    input: {
      minHeight: 48,
      paddingVertical: 12,
      paddingRight: 14,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    phoneInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    phoneInputRowFocused: {
      borderColor: colors.brand,
      borderWidth: 2,
      backgroundColor: colors.surface,
    },
    countryCodeBlock: {
      paddingLeft: 14,
      paddingRight: 8,
      justifyContent: 'center',
      minHeight: 48,
    },
    countryCode: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    codeDivider: {
      width: 1,
      alignSelf: 'stretch',
      marginVertical: 10,
      backgroundColor: colors.borderSubtle,
    },
    phoneInput: {
      flex: 1,
      paddingLeft: 12,
    },
    inputDefault: {
      fontFamily: theme.typography.regular,
    },
    inputFilled: {
      fontFamily: theme.typography.semiBold,
    },
    primaryButton: {
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: colors.buttonBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      minHeight: 48,
    },
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    primaryButtonContainer: {
      paddingTop: 12,
      paddingBottom: 32,
      backgroundColor: colors.surface,
    },
    primaryCtaDescRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 6,
      marginBottom: 12,
    },
    primaryCtaDesc: {
      flex: 1,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 18,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      marginBottom: 10,
    },
    primaryButtonText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
    },
  });
}

export function AuthWithPhone({ mode, onBack, onVerify }: AuthWithPhoneProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createAuthPhoneStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const digitsOnly = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const isPhoneValid = digitsOnly.length === 10;

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    const formatted =
      digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
    setPhone(formatted);
  };

  const title = mode === 'login' ? 'Login with Phone' : 'Sign up with Phone';
  const subtitle =
    mode === 'login'
      ? 'Enter your mobile number to sign in.'
      : 'We use your phone number to sign you in and for account recovery.';
  const primaryCta = mode === 'login' ? 'Login' : 'Continue';
  const primaryCtaDescription =
    mode === 'login' ? '' : 'We will send an OTP to your number for verification.';

  const handlePrimaryAction = async () => {
    if (!isPhoneValid || isSubmitting) return;
    const e164 = `+91${digitsOnly}`;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await authApi.requestPhoneOtp({ phone: e164 });
      if (__DEV__ && res.otp != null && res.otp !== '') {
        console.log('[Mockhu dev] Phone OTP (from API):', res.otp);
      }
      onVerify(e164);
    } catch (e) {
      const message =
        e instanceof AppError ? e.message : 'Could not send OTP. Try again.';
      setSubmitError(message);
      if (__DEV__) {
        console.warn('[Mockhu] requestPhoneOtp failed:', message, e);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: Math.max(insets.top, 24) }]}
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
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View
            style={[
              styles.phoneInputRow,
              isPhoneFocused && styles.phoneInputRowFocused,
            ]}
          >
            <View style={styles.countryCodeBlock}>
              <Text style={styles.countryCode}>+91</Text>
            </View>
            <View style={styles.codeDivider} />
            <TextInput
              style={[styles.input, styles.phoneInput, phone.length > 0 ? styles.inputFilled : styles.inputDefault]}
              placeholder="99999 99999"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={handlePhoneChange}
              maxLength={11}
              onFocus={() => setIsPhoneFocused(true)}
              onBlur={() => setIsPhoneFocused(false)}
              accessibilityLabel="Mobile number"
              textContentType="telephoneNumber"
              autoComplete="tel-national"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.primaryButtonContainer}>
        {primaryCtaDescription ? (
          <View style={styles.primaryCtaDescRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.primaryCtaDesc}>{primaryCtaDescription}</Text>
          </View>
        ) : null}
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        <Pressable
          style={[styles.primaryButton, (!isPhoneValid || isSubmitting) && styles.primaryButtonDisabled]}
          onPress={() => void handlePrimaryAction()}
          disabled={!isPhoneValid || isSubmitting}
          android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isPhoneValid || isSubmitting }}
          accessibilityLabel={primaryCta}
        >
          <Text style={styles.primaryButtonText}>{primaryCta}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
