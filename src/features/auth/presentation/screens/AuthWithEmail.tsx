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
import { AppError, authApi } from '../../../../api';
import type { TokenResponse } from '../../../../api/types';
import { theme } from '../../../../presentation/theme/theme';

type AuthWithEmailProps = {
    mode: 'signup' | 'login';
    onBack: () => void;
    /** Called after tokens + user are persisted (navigate using `is_onboarded`). */
    onAuthSuccess?: (tokens: TokenResponse) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthWithEmail({ mode, onBack, onAuthSuccess }: AuthWithEmailProps) {
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
        emailValid &&
        (mode === 'login' ? password.length > 0 : signupPasswordValid);

    const title = mode === 'login' ? 'Login with Email' : 'Sign up with Email';
    const subtitle =
        mode === 'login'
            ? 'Sign in with your email and password.'
            : 'Create your account with your email and password.\nWe use your email for your account and recovery.';
    const primaryCta = mode === 'login' ? 'Login' : 'Continue';
    const primaryCtaDescription =
        mode === 'login'
            ? ''
            : 'We will send a link to your email to verify your account.';

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
            style={styles.screen}
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
                            size={28}
                            color={theme.colors.textPrimary}
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
                            focusedField === 'email' ? styles.inputFocused : null,
                        ]}
                        placeholder="Enter your email"
                        placeholderTextColor={theme.colors.textMuted}
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
                            focusedField === 'password' ? styles.inputFocused : null,
                        ]}
                        placeholder="Enter your password"
                        placeholderTextColor={theme.colors.textMuted}
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
                        <View style={styles.passwordRequirementsContainer}>
                            <RequirementRow
                                met={passwordChecks.minLen}
                                text="At least 8 characters"
                            />
                            <Text style={styles.fieldHint}>
                                You can use any mix of letters, numbers, and symbols. For a
                                stronger password, include upper and lower case.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.forgotPasswordContainer}>
                            <Pressable
                                onPress={() => { }}
                                accessibilityRole="button"
                                accessibilityLabel="Forgot password"
                                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                            >
                                <Text style={styles.forgotPasswordText}>
                                    Forgot your password?
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.primaryButtonContainer}>
                {primaryCtaDescription ? (
                    <View style={styles.primaryCtaDescRow}>
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={16}
                            color={theme.colors.textMuted}
                        />
                        <Text style={styles.primaryCtaDesc}>
                            {primaryCtaDescription}
                        </Text>
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
                    android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isFormValid || isSubmitting }}
                    accessibilityLabel={primaryCta}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                    ) : (
                        <Text style={styles.primaryButtonText}>{primaryCta}</Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

function RequirementRow({ met, text }: { met: boolean; text: string }) {
    return (
        <View style={styles.passwordRequirement}>
            <MaterialCommunityIcons
                name={met ? 'check-circle' : 'information-outline'}
                size={16}
                color={met ? theme.colors.brand : theme.colors.textMuted}
            />
            <Text style={styles.requirementText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff',
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
        color: theme.colors.textPrimary,
        textAlign: 'left',
    },
    subtitle: {
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.textMuted,
        textAlign: 'left',
        marginTop: 8,
        lineHeight: 20,
    },
    form: {
        width: '100%',
    },
    label: {
        fontFamily: theme.typography.medium,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.textPrimary,
    },
    labelSpaced: {
        marginTop: 14,
    },
    fieldHint: {
        marginTop: 6,
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.xs,
        color: theme.colors.textMuted,
    },
    input: {
        minHeight: 48,
        marginTop: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: theme.fintSizes.md,
        color: theme.colors.textPrimary,
        backgroundColor: '#fff',
    },
    inputFocused: {
        borderColor: theme.colors.brand,
        borderWidth: 2,
    },
    inputDefault: {
        fontFamily: theme.typography.regular,
    },
    inputFilled: {
        fontFamily: theme.typography.semiBold,
    },
    primaryButton: {
        borderRadius: theme.radius.button,
        backgroundColor: theme.colors.brand,
        borderWidth: 0,
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
        backgroundColor: '#fff',
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
        color: theme.colors.textMuted,
        lineHeight: 18,
    },
    errorText: {
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.danger,
        marginBottom: 10,
    },
    primaryButtonText: {
        fontFamily: theme.typography.semiBold,
        fontSize: theme.fintSizes.md,
        color: theme.colors.onBrand,
    },
    passwordRequirement: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
    },
    requirementText: {
        flex: 1,
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.textPrimary,
    },
    passwordRequirementsContainer: {
        marginTop: 16,
        gap: 8,
    },
    forgotPasswordContainer: {
        marginTop: 16,
        alignItems: 'flex-end',
    },
    forgotPasswordText: {
        fontFamily: theme.typography.regular,
        fontSize: theme.fintSizes.sm,
        color: theme.colors.brand,
        textDecorationLine: 'underline',
    },
});
