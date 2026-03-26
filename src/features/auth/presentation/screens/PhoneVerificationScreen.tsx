import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { theme } from '../../../../presentation/theme/theme';

type PhoneVerificationScreenProps = {
    mode: 'signup' | 'login';
    onBack: () => void;
};

export function PhoneVerificationScreen({ onBack }: PhoneVerificationScreenProps) {
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const title = 'Verify your phone number';
    const subtitle = 'Enter the 6-digit code sent to your phone number';
    const primaryCta = 'Verify';
    const handlePrimaryAction = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
        }, 1200);
    };


    useEffect(() => {
        if (otp.length === 6) {
            handlePrimaryAction();
        }
    }, [otp]);

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
            <View>
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
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

                <View style={styles.formCard}>
                    <View style={styles.form}>
                        <Text style={styles.label}>Enter OTP</Text>
                        <View style={styles.otpInputRow}>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.otpInput,
                                    otp.length > 0 ? styles.inputFilled : styles.inputDefault,
                                ]}
                                placeholder="Enter your OTP"
                                placeholderTextColor={theme.colors.surface}
                                keyboardType="numeric"
                                value={otp}
                                onChangeText={setOtp}
                                maxLength={6}
                            />
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.primaryButtonContainer}>
                <Pressable
                    style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
                    onPress={handlePrimaryAction}
                    disabled={isSubmitting}
                >
                    <View style={styles.primaryButtonContent}>
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                        ) : null}
                        <Text style={styles.primaryButtonText}>
                            {isSubmitting ? "" : primaryCta}
                        </Text>
                    </View>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f6f8fc',
        paddingHorizontal: 20,
        paddingTop: 24,
        justifyContent: 'space-between',
    },
    header: {
        marginBottom: 16,
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
    formCard: {
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        padding: 16,
    },
    form: {
        width: '100%',
        gap: 12,
    },
    label: {
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.textPrimary,
    },
    input: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: theme.fintSizes.md,
        color: theme.colors.textPrimary,
    },
    otpInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderStrong,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
    },
    otpInput: {
        flex: 1,
    },
    inputDefault: {
        fontFamily: theme.typography.regular,
    },
    inputFilled: {
        fontFamily: theme.typography.semiBold,
        letterSpacing: 4,
    },
    primaryButton: {
        borderRadius: 24,
        backgroundColor: theme.colors.brand,
        borderWidth: 1,
        borderColor: theme.colors.borderStrong,
        alignItems: 'center',
        paddingVertical: 12,
    },
    primaryButtonDisabled: {
        opacity: 0.9,
    },
    primaryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
    },
    primaryButtonContainer: {
        marginBottom: 32,
        paddingTop: 16,
        paddingBottom: 12,
    },
    primaryButtonText: {
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.md,
        color: theme.colors.textPrimary,
    },
});
