import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '../../../presentation/theme/ThemeContext';
import { Shimmer } from './Shimmer';

type BoxProps = {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
};

/** Rounded rectangle skeleton block. */
export function SkeletonBox({ width, height, radius = 6, style }: BoxProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.borderSubtle },
        style,
      ]}
    />
  );
}

type CircleProps = { size: number; style?: ViewStyle };

/** Circular skeleton placeholder (avatar, icon). */
export function SkeletonCircle({ size, style }: CircleProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.borderSubtle,
        },
        style,
      ]}
    />
  );
}

type LinesProps = {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: number | `${number}%`;
  style?: ViewStyle;
};

/** Multiple text-line placeholders. */
export function SkeletonLines({
  lines = 3,
  lineHeight = 12,
  gap = 10,
  lastLineWidth = '60%',
  style,
}: LinesProps) {
  const colors = useThemeColors();
  const rows = useMemo(() => Array.from({ length: lines }, (_, i) => i), [lines]);
  return (
    <View style={[{ gap }, style]}>
      {rows.map((i) => (
        <View
          key={i}
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
            height: lineHeight,
            borderRadius: lineHeight / 2,
            backgroundColor: colors.borderSubtle,
          }}
        />
      ))}
    </View>
  );
}

type RowProps = { children: React.ReactNode; style?: ViewStyle };

/** Horizontal layout helper for composing skeleton pieces. */
export function SkeletonRow({ children, style }: RowProps) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/** Wrapper that applies the shimmer animation to its children. */
export function SkeletonGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <Shimmer style={style}>{children}</Shimmer>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
