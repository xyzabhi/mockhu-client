import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
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

type AuthWithPhoneProps = {
    mode: 'signup' | 'login';
    onBack: () => void;
};

export function AuthWithPhone({ mode, onBack }: AuthWithPhoneProps) {
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handlePhoneChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
        const formatted =
            digitsOnly.length > 5
                ? `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`
                : digitsOnly;
        setPhone(formatted);
    };

    const title = mode === 'login' ? 'Login with Phone' : 'Sign up with Phone';
    const subtitle =
        mode === 'login'
            ? 'Enter your mobile number to login'
            : 'Your phone number will be used to login to your account.We will also using this for account recovery purposes.';
    const primaryCta = mode === 'login' ? 'Login' : 'Continue';
    const primaryCtaDescription = mode === 'login' ? '' : 'We will send OTP to your phone number for verification.';
    const handlePrimaryAction = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
        }, 1200);
    };

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
                        <Text style={styles.label}>Phone number</Text>
                        <View style={styles.phoneInputRow}>
                            <Text style={styles.countryCode}>+91</Text>
                            <TextInput
                                style={[styles.input, styles.phoneInput, phone.length > 0 ? styles.inputFilled : styles.inputDefault]}
                                placeholder="99999 99999"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={handlePhoneChange}
                                maxLength={11}
                            />
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.primaryButtonContainer}>
                {primaryCtaDescription ? (
                    <View style={styles.primaryCtaDescRow}>
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={16}
                            color={theme.colors.textMuted}
                        />
                        <Text style={styles.primaryCtaDesc}>{primaryCtaDescription}</Text>
                    </View>
                ) : null}
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
    phoneInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
    },
    countryCode: {
        paddingLeft: 14,
        paddingRight: 10,
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.md,
        color: theme.colors.textPrimary,
    },
    phoneInput: {
        flex: 1,
        paddingLeft: 10,
    },
    inputDefault: {
        fontFamily: theme.typography.regular,
    },
    inputFilled: {
        fontFamily: theme.typography.semiBold,
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
    primaryCtaDescRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 6,
        marginVertical: 8,
    },
    primaryCtaDesc: {
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        flexShrink: 1,
    },
    primaryButtonText: {
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.md,
        color: theme.colors.textPrimary,
    },
});
