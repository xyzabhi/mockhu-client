import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../../presentation/theme/ThemeContext';
import { SkeletonBox, SkeletonCircle, SkeletonGroup, SkeletonRow } from './SkeletonPrimitives';

/** Single user row skeleton: avatar + name + secondary line. */
function UserRowSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SkeletonRow style={styles.row}>
      <SkeletonCircle size={44} />
      <View style={styles.text}>
        <SkeletonBox width={120} height={12} radius={6} />
        <SkeletonBox width={80} height={10} radius={5} />
      </View>
      <SkeletonBox width={64} height={28} radius={8} />
    </SkeletonRow>
  );
}

/** List of user row skeletons. */
export function UserListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup style={feedStyles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <UserRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.screenPaddingH,
      gap: 12,
    },
    text: {
      flex: 1,
      gap: 8,
    },
  });
}

const feedStyles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
  },
});
