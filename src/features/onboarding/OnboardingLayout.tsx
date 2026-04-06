import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppError } from '../../api';
import { useOnboardingDraft } from './OnboardingDraftContext';
import { OnboardingFinishCelebration } from './OnboardingFinishCelebration';
import { BioScreen } from './presentation/screens/BioScreen';
import { DOBScreen } from './presentation/screens/DOBScreen';
import { GradeScreen } from './presentation/screens/GradeScreen';
import { OnboardingExamInterestsScreen } from './presentation/screens/OnboardingExamInterestsScreen';
import { NameGenderScreen } from './presentation/screens/NameGenderScreen';
import { PhotoUsernameScreen } from './presentation/screens/PhotoUsername';
import { theme } from '../../presentation/theme/theme';
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

export function OnboardingLayout({ onFinish }: OnboardingLayoutProps = {}) {
  const insets = useSafeAreaInsets();
  const { submitOnboarding } = useOnboardingDraft();
  const [step, setStep] = useState(0);
  const [showFinishCelebration, setShowFinishCelebration] = useState(false);
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

  const handlePrimary = useCallback(() => {
    if (isLast) {
      void (async () => {
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
        }
      })();
      return;
    }
    setStep((s) => s + 1);
  }, [isLast, submitOnboarding]);

  const handleCelebrationComplete = useCallback(() => {
    setShowFinishCelebration(false);
    onFinish?.();
  }, [onFinish]);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <OnboardingFinishCelebration
        visible={showFinishCelebration}
        onComplete={handleCelebrationComplete}
      />
      <View style={[styles.body, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
                color={theme.colors.textPrimary}
              />
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
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

      <Pressable
        style={[
          styles.primaryButton,
          !stepCanContinue && styles.primaryButtonDisabled,
        ]}
        onPress={handlePrimary}
        disabled={!stepCanContinue}
        android_ripple={{
          color: stepCanContinue ? 'rgba(255,255,255,0.2)' : 'rgba(79,70,229,0.12)',
        }}
        accessibilityRole="button"
        accessibilityLabel={isLast ? 'Finish onboarding' : 'Continue to next step'}
        accessibilityState={{ disabled: !stepCanContinue }}
      >
        <Text
          style={[
            styles.primaryButtonText,
            !stepCanContinue && styles.primaryButtonTextDisabled,
          ]}
        >
          {isLast ? 'Finish' : 'Continue'}
        </Text>
      </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  body: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 40,
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
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fontSizes.body,
    color: theme.colors.textMuted,
    lineHeight: theme.lineHeight.body,
  },
  stepSlot: {
    flex: 1,
    minHeight: 0,
    backgroundColor: theme.colors.surface,
  },
  primaryButton: {
    marginHorizontal: theme.spacing.screenPaddingH,
    marginBottom: 24,
    borderRadius: theme.radius.button,
    borderWidth: 0,
    backgroundColor: theme.colors.brand,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.ctaDisabledBackground,
    borderWidth: 1,
    borderColor: theme.colors.brand,
  },
  primaryButtonText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.onBrand,
    textAlign: 'center',
  },
  primaryButtonTextDisabled: {
    color: theme.colors.brand,
  },
});
