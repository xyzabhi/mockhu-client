import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppError, clearSession } from '../../api';
import { resetToRoute } from '../../navigation/navigationRef';
import { useOnboardingDraft } from './OnboardingDraftContext';
import { OnboardingFinishCelebration } from './OnboardingFinishCelebration';
import { BioScreen } from './presentation/screens/BioScreen';
import { DOBScreen } from './presentation/screens/DOBScreen';
import { GradeScreen } from './presentation/screens/GradeScreen';
import { OnboardingExamInterestsScreen } from './presentation/screens/OnboardingExamInterestsScreen';
import { NameGenderScreen } from './presentation/screens/NameGenderScreen';
import { PhotoUsernameScreen } from './presentation/screens/PhotoUsername';
import { BrandLogo, BRAND_LOGO_ASPECT } from '../../shared/components/BrandLogo';
import { theme } from '../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
} from '../../presentation/theme/ThemeContext';
import type { OnboardingStepScreenProps } from './onboardingStepTypes';

type OnboardingStep = {
  component: ComponentType<OnboardingStepScreenProps>;
  title: string;
  /** Omit or leave empty for a minimal header (title only). */
  description?: string;
};

/**
 * Onboarding field map (6 steps):
 * 1 Personal info → first_name, last_name, gender
 * 2 Date of birth → dob
 * 3 Class / Grade → grade
 * 4 Bio → bio (optional)
 * 5 Photo + username → avatar_url, username
 * 6 Interests → exam_category_ids, exam_ids
 */
/** Steps where Continue is enabled before the user completes required input (optional steps). */
function initialCanContinueForStep(stepIndex: number): boolean {
  const bioStep = 3;
  return stepIndex === bioStep;
}

const screens: OnboardingStep[] = [
  {
    component: NameGenderScreen,
    title: 'Personal info',
    description: 'Your first name, last name, and gender.',
  },
  {
    component: DOBScreen,
    title: 'Date of birth',
    description: 'We use this to personalize your experience.',
  },
  {
    component: GradeScreen,
    title: 'Class / Grade',
    description: 'Helps us show age-appropriate content.',
  },
  {
    component: BioScreen,
    title: 'Bio',
    description: 'A short intro about you — optional.',
  },
  {
    component: PhotoUsernameScreen,
    title: 'Photo & username',
    description: 'Profile photo and a unique handle.',
  },
  {
    component: OnboardingExamInterestsScreen,
    title: 'Interests',
    description: 'Pick exam categories and exams you care about.',
  },
];

type OnboardingLayoutProps = {
  onFinish?: () => void;
};

function createOnboardingLayoutStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    body: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingBottom: 16,
    },
    brandRow: {
      alignItems: 'center',
      marginBottom: 10,
    },
    brandLogo: {
      height: 56,
      aspectRatio: BRAND_LOGO_ASPECT,
      maxWidth: '100%',
      borderRadius: theme.radius.card,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      minHeight: 40,
    },
    headerTopRowSpacer: {
      flex: 1,
      minWidth: 8,
    },
    logoutButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: colors.buttonBorder,
      backgroundColor: colors.surface,
    },
    logoutButtonPressed: {
      opacity: 0.65,
    },
    logoutButtonText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    backButton: {
      width: 40,
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    backButtonPlaceholder: {
      width: 40,
      height: 40,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      lineHeight: 28,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    description: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.body,
      color: colors.textMuted,
      lineHeight: theme.lineHeight.body,
    },
    stepSlot: {
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.surface,
    },
    primaryButton: {
      marginHorizontal: theme.spacing.screenPaddingH,
      marginBottom: 24,
      borderRadius: theme.radius.button,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.brand,
      backgroundColor: colors.brand,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      overflow: 'hidden',
    },
    primaryButtonDisabled: {
      backgroundColor: colors.ctaDisabledBackground,
      borderWidth: 1,
      borderColor: colors.brand,
    },
    primaryButtonText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
      textAlign: 'center',
      ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    },
    primaryButtonTextDisabled: {
      color: colors.brand,
      ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    },
  });
}

export function OnboardingLayout({ onFinish }: OnboardingLayoutProps = {}) {
  const colors = useThemeColors();
  const styles = useMemo(() => createOnboardingLayoutStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { submitOnboarding } = useOnboardingDraft();
  const [step, setStep] = useState(0);
  const [showFinishCelebration, setShowFinishCelebration] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [stepCanContinue, setStepCanContinue] = useState(() =>
    initialCanContinueForStep(0),
  );
  const current = screens[step];
  const Step = current.component;
  const isLast = step === screens.length - 1;

  const handleStepValidityChange = useCallback((canContinue: boolean) => {
    setStepCanContinue(canContinue);
  }, []);

  useEffect(() => {
    setStepCanContinue(initialCanContinueForStep(step));
  }, [step]);

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleLogout = useCallback(() => {
    Alert.alert('Log out?', 'You can sign in again anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await clearSession();
              resetToRoute('Auth');
            } catch {
              resetToRoute('Auth');
            }
          })();
        },
      },
    ]);
  }, []);

  const handlePrimary = useCallback(() => {
    if (isLast) {
      void (async () => {
        if (isFinishing) return;
        setIsFinishing(true);
        try {
          await submitOnboarding();
          setShowFinishCelebration(true);
        } catch (e) {
          const msg =
            e instanceof AppError
              ? e.message
              : e instanceof Error
                ? e.message
                : 'Something went wrong.';
          Alert.alert('Could not finish', msg);
        } finally {
          setIsFinishing(false);
        }
      })();
      return;
    }
    setStep((s) => s + 1);
  }, [isLast, isFinishing, submitOnboarding]);

  const handleCelebrationComplete = useCallback(() => {
    setShowFinishCelebration(false);
    onFinish?.();
  }, [onFinish]);

  const primaryDisabled = !stepCanContinue || (isLast && isFinishing);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <OnboardingFinishCelebration
        visible={showFinishCelebration}
        onComplete={handleCelebrationComplete}
      />
      <View style={[styles.body, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandRow}>
          <BrandLogo style={styles.brandLogo} />
        </View>
        <View style={styles.headerTopRow}>
          {step > 0 ? (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={8}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={28}
                color={colors.textPrimary}
              />
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          <View style={styles.headerTopRowSpacer} />
          {step === 0 ? (
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
              hitSlop={8}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              accessibilityRole="button"
              accessibilityLabel="Log out and return to sign in"
            >
              <Text style={styles.logoutButtonText}>Log out</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{current.title}</Text>
        </View>
        {current.description ? (
          <Text style={styles.description}>{current.description}</Text>
        ) : null}
      </View>

      <View style={styles.stepSlot}>
        <Step onStepValidityChange={handleStepValidityChange} />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          primaryDisabled && styles.primaryButtonDisabled,
        ]}
        onPress={handlePrimary}
        disabled={primaryDisabled}
        activeOpacity={primaryDisabled ? 1 : 0.88}
        accessibilityRole="button"
        accessibilityLabel={isLast ? 'Finish onboarding' : 'Continue to next step'}
        accessibilityState={{ disabled: primaryDisabled, busy: isLast && isFinishing }}
      >
        {isLast && isFinishing ? (
          <ActivityIndicator size="small" color={colors.onBrand} />
        ) : (
          <Text
            style={[
              styles.primaryButtonText,
              primaryDisabled && styles.primaryButtonTextDisabled,
            ]}
          >
            {isLast ? 'Finish' : 'Continue'}
          </Text>
        )}
      </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
