import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { theme } from '../../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../../presentation/theme/ThemeContext';
import {
  SkeletonBox,
  SkeletonCircle,
  SkeletonGroup,
  SkeletonLines,
  SkeletonRow,
} from './SkeletonPrimitives';

/** Matches the real PostCard layout: avatar + header, title line, body lines, footer bar. */
export function PostCardSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SkeletonGroup style={styles.card}>
      {/* Avatar + name / meta */}
      <SkeletonRow>
        <SkeletonCircle size={40} />
        <View style={styles.headerRight}>
          <SkeletonRow style={styles.nameRow}>
            <SkeletonBox width={110} height={12} radius={6} />
            <SkeletonBox width={48} height={10} radius={5} />
          </SkeletonRow>
          <SkeletonRow style={styles.topicRow}>
            <SkeletonBox width={60} height={10} radius={5} />
            <SkeletonBox width={50} height={10} radius={5} />
            <SkeletonBox width={70} height={10} radius={5} />
          </SkeletonRow>
        </View>
      </SkeletonRow>

      {/* Title */}
      <SkeletonBox width="85%" height={14} radius={7} style={styles.titleLine} />

      {/* Body lines */}
      <SkeletonLines lines={3} lineHeight={11} gap={9} lastLineWidth="55%" style={styles.body} />

      {/* Footer action bar */}
      <View style={styles.footer}>
        <SkeletonBox width={32} height={10} radius={5} />
        <SkeletonBox width={32} height={10} radius={5} />
        <SkeletonBox width={24} height={10} radius={5} />
      </View>
    </SkeletonGroup>
  );
}

/**
 * Renders `count` PostCardSkeleton items with spacing — drop-in replacement
 * for the feed while the first page loads.
 */
export function PostFeedSkeleton({ count = 4 }: { count?: number }) {
  const styles = useMemo(() => feedStyles, []);
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.cardPaddingH,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    headerRight: {
      flex: 1,
      gap: 8,
    },
    nameRow: {
      gap: 8,
    },
    topicRow: {
      gap: 4,
    },
    titleLine: {
      marginTop: 14,
    },
    body: {
      marginTop: 10,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
  });
}

const feedStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 4,
    gap: 12,
  },
});
