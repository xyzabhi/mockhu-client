import ConfettiCannon from 'react-native-confetti-cannon';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../../presentation/theme/theme';
import { useThemeColors } from '../../presentation/theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Time to show celebration before calling `onComplete` (navigation, etc.). */
const CELEBRATION_DURATION_MS = 3400;

type OnboardingFinishCelebrationProps = {
  visible: boolean;
  onComplete: () => void;
};

export function OnboardingFinishCelebration({
  visible,
  onComplete,
}: OnboardingFinishCelebrationProps) {
  const colors = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: colors.surface,
        },
        textBlock: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
          zIndex: 10,
        },
        emoji: {
          fontSize: 56,
          marginBottom: 12,
        },
        title: {
          fontFamily: theme.typography.semiBold,
          fontSize: theme.fintSizes.xxxl,
          color: colors.textPrimary,
          textAlign: 'center',
          letterSpacing: -0.4,
        },
        subtitle: {
          marginTop: 6,
          fontFamily: theme.typography.medium,
          fontSize: theme.fintSizes.lg,
          color: colors.textMuted,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const confettiRef = useRef<{ start?: () => void } | null>(null);
  const textOpacity = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) {
      textOpacity.setValue(0);
      return;
    }

    const anim = Animated.timing(textOpacity, {
      toValue: 1,
      duration: 500,
      delay: 180,
      useNativeDriver: true,
    });
    anim.start();

    const frame = requestAnimationFrame(() => {
      confettiRef.current?.start?.();
    });

    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, CELEBRATION_DURATION_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      anim.stop();
    };
  }, [visible, textOpacity]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop} pointerEvents="box-none">
        <ConfettiCannon
          ref={(instance) => {
            confettiRef.current = instance;
          }}
          count={280}
          origin={{ x: SCREEN_WIDTH / 2, y: -28 }}
          autoStart={false}
          fadeOut
          fallSpeed={4000}
          explosionSpeed={380}
          colors={[
            colors.brand,
            colors.progress,
            colors.textPrimary,
            colors.brandBorder,
            '#FBBF24',
            '#60A5FA',
            '#F472B6',
          ]}
        />
        <Animated.View
          style={[styles.textBlock, { opacity: textOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Mockhu</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
