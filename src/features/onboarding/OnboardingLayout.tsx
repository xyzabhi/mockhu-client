import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BioScreen } from './presentation/screens/BioScreen';
import { DOBScreen } from './presentation/screens/DOBScreen';
import { InterestScreen } from './presentation/screens/InterestScreen';
import { NameDobScreen } from './presentation/screens/NameGenderScreen';
import { PhotoUsernameScreen } from './presentation/screens/PhotoUsername';
import { theme } from '../../presentation/theme/theme';

const screens = [
  {
    component: NameDobScreen,
    title: 'Name and Gender',
    description: 'Enter first, last name and gender to get started. It could be male, female, other, etc.',
  },
  {
    component: DOBScreen,
    title: 'Date of Birth',
    description: 'Enter your date of birth, must be 13 years old or older',
  },
  {
    component: BioScreen,
    title: 'Enter Bio (Optional)',
    description: 'Enter your bio to help others get to know you and we will use it to personalize your experience',
  },
  {
    component: PhotoUsernameScreen,
    title: 'Photo and Username',
    description: 'Upload a photo and choose a username. Must be unique and 3-16 characters long',
  },
  {
    component: InterestScreen,
    title: 'Interest',
    description: 'Select your interests to help us personalize your experience.It could be exam interest, career interest, subject interest, etc.',
  },
] as const;

type OnboardingLayoutProps = {
  onFinish?: () => void;
};

export function OnboardingLayout({ onFinish }: OnboardingLayoutProps = {}) {
  const [step, setStep] = useState(0);
  const progressAnim = useRef(new Animated.Value((1 / screens.length) * 100)).current;
  const current = screens[step];
  const Step = current.component;
  const isLast = step === screens.length - 1;

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
      onFinish?.();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {step > 0 ? (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={8}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
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
        <Text style={styles.title}>{current.title}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.description}>{current.description}</Text>
        </View>
      </View>

      <View style={styles.stepSlot}>
        <Step />
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={handlePrimary}
        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
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
        <Text style={styles.primaryButtonText}>
          {isLast ? 'Finish' : `Step ${step + 1} of ${screens.length}`}
        </Text>
      </Pressable>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xl,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  description: {
    flex: 1,
    flexShrink: 1,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  stepSlot: {
    flex: 1,
    minHeight: 0,
  },
  primaryButton: {
    marginHorizontal: 20,
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
