import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../../presentation/theme/ThemeContext';
import {
  SkeletonBox,
  SkeletonCircle,
  SkeletonGroup,
  SkeletonLines,
  SkeletonRow,
} from './SkeletonPrimitives';

/** Single comment thread skeleton: avatar + author line + body lines. */
function CommentThreadSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.thread}>
      <SkeletonRow>
        <SkeletonCircle size={32} />
        <View style={styles.right}>
          <SkeletonRow style={styles.nameRow}>
            <SkeletonBox width={100} height={11} radius={5} />
            <SkeletonBox width={40} height={9} radius={4} />
          </SkeletonRow>
          <SkeletonLines lines={2} lineHeight={10} gap={8} lastLineWidth="70%" />
        </View>
      </SkeletonRow>
    </View>
  );
}

/** Multiple comment thread skeletons. */
export function CommentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonGroup style={feedStyles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <CommentThreadSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    thread: {
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.screenPaddingH,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    right: {
      flex: 1,
      gap: 8,
    },
    nameRow: {
      gap: 6,
    },
  });
}

const feedStyles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
  },
});
