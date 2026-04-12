import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { AppError, clearSession, mergeSessionUser, postOnboarding } from '../../../../api';
import { resetToRoute } from '../../../../navigation/navigationRef';
import { theme } from '../../../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { BrandLogo, BRAND_LOGO_ASPECT } from '../../../../shared/components/BrandLogo';
import { useMessageModal } from '../../../../shared/components/MessageModal';
import { OnboardingExamPicker } from '../components/OnboardingExamPicker';
import { TargetYearPicker } from '../components/TargetYearPicker';
import {
  buildOnboardingPayload,
  MAX_TARGET_YEAR,
  minTargetYear,
  type OnboardingDraft,
  type SelectedExamDraft,
  sessionUserPatchFromOnboardingResponse,
  validateOnboardingExamsStep,
  validateOnboardingNameStep,
  validateOnboardingYearStep,
} from '../../onboardingDraft';
import {
  createOnboardingStepStyles,
  onboardingInputShadow,
} from '../../onboardingStepStyles';

const TOTAL_STEPS = 3;
const textAndroid = Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : {};

const ONBOARDING_EXAMS_DRAFT_KEY = 'onboarding.draft.exams.v1';

function parseStoredExams(raw: string | null): SelectedExamDraft[] | null {
  if (raw == null || raw === '') return null;
  try {
    const x = JSON.parse(raw) as unknown;
    if (!Array.isArray(x) || x.length === 0) return null;
    const out: SelectedExamDraft[] = [];
    for (const e of x) {
      if (!e || typeof e !== 'object') return null;
      const o = e as Record<string, unknown>;
      if (
        typeof o.id !== 'number' ||
        typeof o.name !== 'string' ||
        typeof o.category_id !== 'number'
      ) {
        return null;
      }
      out.push({
        id: o.id,
        name: o.name,
        category_id: o.category_id,
        user_count: typeof o.user_count === 'number' ? o.user_count : undefined,
      });
    }
    return out;
  } catch {
    return null;
  }
}

type OnboardingCompletionScreenProps = {
  onFinish?: () => void;
};

export function OnboardingCompletionScreen({ onFinish }: OnboardingCompletionScreenProps) {
  const colors = useThemeColors();
  const stepStyles = useMemo(() => createOnboardingStepStyles(colors), [colors]);
  const inputShadow = onboardingInputShadow();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { modal, show: showModal, hide: hideModal } = useMessageModal();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SelectedExamDraft[]>([]);
  const [examError, setExamError] = useState<string | null>(null);

  const [targetYearText, setTargetYearText] = useState(String(new Date().getFullYear()));
  const [yearError, setYearError] = useState<string | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [examDraftHydrated, setExamDraftHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(ONBOARDING_EXAMS_DRAFT_KEY);
        const parsed = parseStoredExams(raw);
        if (!cancelled && parsed && parsed.length > 0) {
          setSelected(parsed);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setExamDraftHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!examDraftHydrated) return;
    void (async () => {
      try {
        if (selected.length === 0) {
          await AsyncStorage.removeItem(ONBOARDING_EXAMS_DRAFT_KEY);
        } else {
          await AsyncStorage.setItem(ONBOARDING_EXAMS_DRAFT_KEY, JSON.stringify(selected));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [selected, examDraftHydrated]);

  const handleLogout = useCallback(() => {
    showModal({
      title: 'Log out?',
      message: 'You can sign in again anytime.',
      buttons: [
        { label: 'Cancel', variant: 'secondary', onPress: hideModal },
        {
          label: 'Log out',
          variant: 'destructive',
          onPress: () => {
            hideModal();
            void (async () => {
              try {
                await AsyncStorage.removeItem(ONBOARDING_EXAMS_DRAFT_KEY);
                await clearSession();
                resetToRoute('Auth');
              } catch {
                try {
                  await AsyncStorage.removeItem(ONBOARDING_EXAMS_DRAFT_KEY);
                } catch {
                  /* ignore */
                }
                resetToRoute('Auth');
              }
            })();
          },
        },
      ],
    });
  }, [hideModal, showModal]);

  const handleBack = useCallback(() => {
    setApiError(null);
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const goNextFromName = useCallback(() => {
    setNameError(null);
    const v = validateOnboardingNameStep(fullName);
    if (!v.ok) {
      setNameError(v.error);
      return;
    }
    setFirstName(v.first_name);
    setLastName(v.last_name);
    setStep(1);
  }, [fullName]);

  const goNextFromExams = useCallback(() => {
    const err = validateOnboardingExamsStep(selected);
    if (err) {
      setExamError(err);
      return;
    }
    setExamError(null);
    setStep(2);
  }, [selected]);

  const handleSubmit = useCallback(async () => {
    setYearError(null);
    const yErr = validateOnboardingYearStep(targetYearText);
    if (yErr) {
      setYearError(yErr);
      return;
    }
    const yearParsed = Number.parseInt(targetYearText.trim(), 10);
    const draft: OnboardingDraft = {
      first_name: firstName,
      last_name: lastName,
      target_year: yearParsed,
      selected_exams: selected,
    };

    setApiError(null);
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = buildOnboardingPayload(draft);
      const data = await postOnboarding(payload);
      await mergeSessionUser(sessionUserPatchFromOnboardingResponse(data, draft));
      try {
        await AsyncStorage.removeItem(ONBOARDING_EXAMS_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      onFinish?.();
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Something went wrong. Try again.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [firstName, lastName, targetYearText, selected, submitting, onFinish]);

  const handlePrimaryPress = useCallback(() => {
    if (step === 0) goNextFromName();
    else if (step === 1) goNextFromExams();
    else void handleSubmit();
  }, [step, goNextFromName, goNextFromExams, handleSubmit]);

  const progressFraction = (step + 1) / TOTAL_STEPS;

  const progressAnim = useRef(new Animated.Value(progressFraction)).current;
  const progressDidMount = useRef(false);

  useEffect(() => {
    if (!progressDidMount.current) {
      progressDidMount.current = true;
      progressAnim.setValue(progressFraction);
      return;
    }
    Animated.timing(progressAnim, {
      toValue: progressFraction,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressFraction]);

  const progressWidth = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      }),
    [progressAnim],
  );

  const primaryDisabled = useMemo(() => {
    if (step === 0) return !fullName.trim();
    if (step === 1) return selected.length === 0;
    return submitting;
  }, [step, fullName, selected.length, submitting]);

  const primaryLabel =
    step === 2 ? (submitting ? 'Saving…' : 'Finish') : 'Continue';

  const stepHeaders = useMemo(
    () =>
      [
        {
          title: 'Your name',
          subtitle: 'First and last in one line.',
        },
        {
          title: 'Exams',
          subtitle: '',
        },
        {
          title: 'Target year',
          subtitle: '',
        },
      ] as const,
    [],
  );

  const headerChrome = (
    <View style={[styles.headerBlock, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.brandRow}>
        <BrandLogo style={styles.brandLogo} accessibilityLabel="Mockhu logo" />
      </View>
      <View style={styles.topRow}>
        {step > 0 ? (
          <Pressable
            onPress={handleBack}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
        <Text style={styles.stepIndicator} accessibilityRole="text">
          Step {step + 1} of {TOTAL_STEPS}
        </Text>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.65 }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Log out and return to sign in"
        >
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: TOTAL_STEPS,
          now: step + 1,
          text: `${step + 1} of ${TOTAL_STEPS}`,
        }}
      >
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      <Text style={styles.screenTitle} accessibilityRole="header">
        {stepHeaders[step].title}
      </Text>
      {stepHeaders[step].subtitle ? (
        <Text style={styles.screenSubtitle}>{stepHeaders[step].subtitle}</Text>
      ) : null}
      {apiError ? (
        <View style={styles.apiErrorBox} accessibilityLiveRegion="polite">
          <Text style={styles.apiErrorText}>{apiError}</Text>
        </View>
      ) : null}
    </View>
  );

  if (step === 0) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {modal}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
        >
          {headerChrome}
          <View style={[styles.bodyPad, stepStyles.field]}>
            <TextInput
              style={[
                styles.textInput,
                inputShadow,
                fullName.length > 0 ? styles.inputFilled : styles.inputDefault,
                nameError ? styles.inputError : styles.inputIdle,
              ]}
              placeholder="First and last name"
              placeholderTextColor={colors.textHint}
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                setNameError(null);
              }}
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              accessibilityLabel="Full name, first and last"
            />
            {nameError ? (
              <Text style={styles.fieldError} accessibilityRole="alert">
                {nameError}
              </Text>
            ) : null}
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handlePrimaryPress}
            disabled={primaryDisabled}
            style={({ pressed }) => [
              styles.primaryButton,
              primaryDisabled && styles.primaryButtonDisabled,
              pressed && !primaryDisabled && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue to exam selection"
            accessibilityState={{ disabled: primaryDisabled }}
          >
            <Text style={[styles.primaryButtonText, textAndroid]}>Continue</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (step === 2) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {modal}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
        >
          {headerChrome}
          <View style={[styles.bodyPad, styles.yearStepBodyPad]}>
            <View style={stepStyles.field}>
              <TargetYearPicker
                value={targetYearText}
                onChange={(y) => {
                  setTargetYearText(y);
                  setYearError(null);
                }}
                placeholder="Tap to choose year"
                error={yearError != null && yearError !== ''}
                accessibilityLabel={`Target exam year, ${minTargetYear()} through ${MAX_TARGET_YEAR}`}
              />
              {yearError ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {yearError}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handlePrimaryPress}
            disabled={primaryDisabled}
            style={({ pressed }) => [
              styles.primaryButton,
              primaryDisabled && styles.primaryButtonDisabled,
              pressed && !primaryDisabled && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Complete onboarding"
            accessibilityState={{ disabled: primaryDisabled, busy: submitting }}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onBrand} />
            ) : (
              <Text style={[styles.primaryButtonText, textAndroid]}>{primaryLabel}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {modal}
      <View style={styles.examStepRoot}>
        {headerChrome}
        {examError ? (
          <View style={styles.bodyPad}>
            <Text style={styles.fieldError} accessibilityRole="alert">
              {examError}
            </Text>
          </View>
        ) : null}
        <View style={styles.examPickerSlot}>
          <OnboardingExamPicker
            selectedExams={selected}
            onSelectionChange={(next) => {
              setSelected(next);
              setExamError(null);
            }}
          />
        </View>
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={handlePrimaryPress}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.primaryButton,
            primaryDisabled && styles.primaryButtonDisabled,
            pressed && !primaryDisabled && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continue to target year"
          accessibilityState={{ disabled: primaryDisabled }}
        >
          <Text style={[styles.primaryButtonText, textAndroid]}>Continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scrollContent: {
      flexGrow: 1,
    },
    examStepRoot: {
      flex: 1,
      minHeight: 0,
    },
    examPickerSlot: {
      flex: 1,
      minHeight: 0,
    },
    headerBlock: {
      paddingHorizontal: theme.spacing.screenPaddingH,
    },
    bodyPad: {
      paddingHorizontal: theme.spacing.screenPaddingH,
    },
    /** Extra air between the “Target year” screen title and the picker. */
    yearStepBodyPad: {
      paddingTop: 10,
    },
    brandRow: {
      alignItems: 'center',
      marginBottom: 8,
    },
    brandLogo: {
      height: 56,
      aspectRatio: BRAND_LOGO_ASPECT,
      maxWidth: '100%',
      borderRadius: theme.radius.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      minHeight: 44,
    },
    iconButton: {
      width: 44,
      minHeight: 44,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    stepIndicator: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
    },
    logoutButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
    },
    logoutButtonText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceSubtle,
      overflow: 'hidden',
      marginBottom: 20,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.brand,
    },
    screenTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      lineHeight: 28,
      color: colors.textPrimary,
      letterSpacing: -0.3,
      marginBottom: 12,
    },
    screenSubtitle: {
      marginTop: 0,
      marginBottom: 20,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.body,
      color: colors.textMuted,
      lineHeight: theme.lineHeight.body,
    },
    apiErrorBox: {
      marginBottom: 12,
      padding: 12,
      borderRadius: theme.radius.input,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
    },
    apiErrorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      lineHeight: 20,
    },
    textInput: {
      minHeight: 52,
      marginTop: 8,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    inputIdle: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
    },
    inputError: {
      borderWidth: 2,
      borderColor: colors.danger,
      backgroundColor: colors.surface,
    },
    inputDefault: {
      fontFamily: theme.typography.regular,
    },
    inputFilled: {
      fontFamily: theme.typography.semiBold,
    },
    fieldError: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    primaryButton: {
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: colors.buttonBorder,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    primaryButtonText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
    },
  });
}
