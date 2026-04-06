import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { AppError, authApi } from '../../../../api';
import type { TokenResponse } from '../../../../api/types';
import { theme } from '../../../../presentation/theme/theme';
import { OtpInput } from '../../../../shared/components/OtpInput';

type PhoneVerificationScreenProps = {
    mode: 'signup' | 'login';
    /** Same E.164 value used for POST /auth/phone/request */
    phoneE164: string;
    onBack: () => void;
    onVerified?: (tokens: TokenResponse) => void;
};

export function PhoneVerificationScreen({
    phoneE164,
    onBack,
    onVerified,
}: PhoneVerificationScreenProps) {
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const submittedForOtp = useRef<string | null>(null);
    /** Stops auto-submit from looping after a wrong code until the user edits digits. */
    const autoSubmitBlockedForOtp = useRef<string | null>(null);

    const title = 'Verify your phone number';
    const subtitle = 'Enter the 6-digit code sent to your phone number';
    const primaryCta = 'Verify';

    const handlePrimaryAction = useCallback(async (fromManual = false) => {
        if (isSubmitting || otp.length !== 6) return;
        if (fromManual) {
            autoSubmitBlockedForOtp.current = null;
            submittedForOtp.current = null;
        }
        setVerifyError(null);
        setIsSubmitting(true);
        try {
            const tokens = await authApi.verifyPhoneOtp({ phone: phoneE164, otp });
            onVerified?.(tokens);
        } catch (e) {
            const message =
                e instanceof AppError ? e.message : 'Invalid or expired code. Try again.';
            setVerifyError(message);
            autoSubmitBlockedForOtp.current = otp;
            submittedForOtp.current = null;
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, otp, phoneE164, onVerified]);

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

    const inputDisabled = isSubmitting;

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={onBack}
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed && styles.backButtonPressed,
                        ]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={28}
                            color={theme.colors.textPrimary}
                        />
                    </Pressable>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>
                </View>

                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Enter OTP</Text>
                    <OtpInput
                        value={otp}
                        onChange={setOtp}
                        disabled={inputDisabled}
                    />
                    {verifyError ? (
                        <Text style={styles.errorText}>{verifyError}</Text>
                    ) : null}
                </View>
            </ScrollView>

            <View style={styles.primaryButtonContainer}>
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
                            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                        ) : null}
                        {!isSubmitting ? (
                            <Text style={styles.primaryButtonText}>{primaryCta}</Text>
                        ) : null}
                    </View>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 24,
    },
    header: {
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    headerContent: {
        marginTop: 24,
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
        fontFamily: theme.typography.bold,
        fontSize: theme.fintSizes.xxl,
        color: theme.colors.textPrimary,
        textAlign: 'left',
        marginTop: 4,
    },
    subtitle: {
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.xs,
        color: theme.colors.textMuted,
        textAlign: 'left',
        marginTop: 6,
        lineHeight: 18,
    },
    fieldBlock: {
        width: '100%',
        gap: 12,
    },
    label: {
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.textPrimary,
    },
    errorText: {
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.danger,
    },
    primaryButton: {
        borderRadius: theme.radius.button,
        backgroundColor: theme.colors.brand,
        borderWidth: 1,
        borderColor: theme.colors.buttonBorder,
        alignItems: 'center',
        paddingVertical: 12,
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
        paddingHorizontal: 20,
        marginBottom: 32,
        paddingTop: 16,
        paddingBottom: 12,
    },
    primaryButtonText: {
        fontFamily: theme.typography.semiBold,
        fontSize: theme.fintSizes.md,
        color: theme.colors.onBrand,
    },
});
