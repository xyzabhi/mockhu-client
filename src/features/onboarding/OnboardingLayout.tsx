import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { OnboardingFinishCelebration } from './OnboardingFinishCelebration';
import { BioScreen } from './presentation/screens/BioScreen';
import { DOBScreen } from './presentation/screens/DOBScreen';
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

/** Steps where Next is allowed before the user types (optional / placeholder). */
function initialCanContinueForStep(stepIndex: number): boolean {
  return stepIndex === 2 || stepIndex === 4;
}

const screens: OnboardingStep[] = [
  { component: NameGenderScreen, title: 'Name' },
  { component: DOBScreen, title: 'Birthday' },
  { component: BioScreen, title: 'Bio' },
  { component: PhotoUsernameScreen, title: 'Profile' },
  { component: OnboardingExamInterestsScreen, title: 'Exams' },
];

type OnboardingLayoutProps = {
  onFinish?: () => void;
};

export function OnboardingLayout({ onFinish }: OnboardingLayoutProps = {}) {
  const [step, setStep] = useState(0);
  const [showFinishCelebration, setShowFinishCelebration] = useState(false);
  const [stepCanContinue, setStepCanContinue] = useState(() =>
    initialCanContinueForStep(0),
  );
  const progressAnim = useRef(new Animated.Value((1 / screens.length) * 100)).current;
  const current = screens[step];
  const Step = current.component;
  const isLast = step === screens.length - 1;

  const handleStepValidityChange = useCallback((canContinue: boolean) => {
    setStepCanContinue(canContinue);
  }, []);

  useEffect(() => {
    setStepCanContinue(initialCanContinueForStep(step));
  }, [step]);

  useEffect(() => {
    const target = ((step + 1) / screens.length) * 100;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handlePrimary = () => {
    if (isLast) {
      setShowFinishCelebration(true);
      return;
    }
    setStep((s) => s + 1);
  };

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
      <View style={styles.body}>
      <View style={styles.header}>
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
          <Text style={styles.stepMeta} accessibilityLabel={`Step ${step + 1} of ${screens.length}`}>
            {step + 1}/{screens.length}
          </Text>
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
        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
        accessibilityState={{ disabled: !stepCanContinue }}
      >
        <View style={styles.primaryButtonTrack} pointerEvents="none">
          <Animated.View
            style={[
              styles.primaryButtonFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.primaryButtonText}>{isLast ? 'Finish' : 'Continue'}</Text>
      </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  body: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xxl,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  stepMeta: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  description: {
    marginTop: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  stepSlot: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    overflow: 'hidden',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonDisabled: {
    opacity: 0.42,
  },
  primaryButtonTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.borderSubtle,
  },
  primaryButtonFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.brand,
  },
  primaryButtonText: {
    zIndex: 1,
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});
