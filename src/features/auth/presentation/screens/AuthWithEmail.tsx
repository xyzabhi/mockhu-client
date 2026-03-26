import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { theme } from '../../../../presentation/theme/theme';

type AuthWithEmailProps = {
    mode: 'signup' | 'login';
    onBack: () => void;
};

export function AuthWithEmail({ mode, onBack }: AuthWithEmailProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const title = mode === 'login' ? 'Login with Email' : 'Sign up with Email';
    const subtitle =
        mode === 'login'
            ? 'Login with your email and password.'
            : 'Create your account using your email and password\nWe use your email to create your account and for account recovery.';
    const primaryCta = mode === 'login' ? 'Login' : 'Continue';
    const primaryCtaDescription = mode === 'login' ? '' : 'We will send link to your email address to verify your account.';

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
                    <View style={styles.formFields}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, email.length > 0 ? styles.inputFilled : styles.inputDefault]}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={[styles.input, password.length > 0 ? styles.inputFilled : styles.inputDefault]}
                            placeholder="Enter your password"
                            secureTextEntry
                            autoCapitalize="none"
                            value={password}
                            onChangeText={setPassword}
                        />
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
                <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>{primaryCta}</Text>
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
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerContent: {
        marginTop: 24,
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        alignSelf: 'flex-start',
        alignItems: 'center',
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
        marginTop: 6,
        textAlign: 'left',
        lineHeight: 18,
    },
    formCard: {
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        padding: 16,
        justifyContent: 'space-between',
    },
    formFields: {
        width: '100%',
        gap: 12,
    },
    label: {
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.textPrimary,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: theme.fintSizes.md,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.surface,
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
        textAlign: 'left',
        flexShrink: 1,
    },
    primaryButtonText: {
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.md,
        color: theme.colors.textPrimary,
    },
});
