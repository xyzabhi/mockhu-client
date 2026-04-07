import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { theme } from '../theme/theme';

/** Compact switch — touch area enlarged via `hitSlop` */
const TRACK_W = 34;
const TRACK_H = 19;
const THUMB = 14;
const PAD = 2;

const TRAVEL = TRACK_W - PAD * 2 - THUMB;

type BrandToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/**
 * iOS-style switch using brand indigo when on — replaces system `Switch` for consistent DS.
 */
export function BrandToggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: BrandToggleProps) {
  const colors = useThemeColors();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 140,
    }).start();
  }, [value, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL],
  });

  const trackColor = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.borderSubtle, colors.brand],
      }),
    [colors.borderSubtle, colors.brand, progress],
  );

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.hit,
        disabled && styles.hitDisabled,
        pressed && !disabled && styles.hitPressed,
      ]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: colors.surface },
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  hitDisabled: {
    opacity: 0.45,
  },
  hitPressed: {
    opacity: 0.92,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: PAD,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    left: PAD,
    top: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});
