import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

const PULSE_DURATION = 1200;

/**
 * Wraps children (skeleton shapes) with a looping opacity-pulse shimmer.
 * Pure RN Animated — no extra dependencies.
 */
export function Shimmer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}
