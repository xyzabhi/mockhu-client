import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../../presentation/theme/ThemeContext';
import {
  SkeletonBox,
  SkeletonCircle,
  SkeletonGroup,
} from './SkeletonPrimitives';

/**
 * Skeleton matching the Profile screen header card: avatar, name, username,
 * follower counts row — shown while profile data is loading.
 */
export function ProfileHeaderSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
        },
        nameArea: {
          alignItems: 'center',
          gap: 8,
        },
        countsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 28,
          marginTop: 4,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 10,
          backgroundColor: colors.surfaceSubtle,
        },
        countBlock: {
          alignItems: 'center',
          gap: 6,
        },
      }),
    [colors],
  );

  return (
    <SkeletonGroup style={styles.wrap}>
      <SkeletonCircle size={92} />
      <View style={styles.nameArea}>
        <SkeletonBox width={140} height={14} radius={7} />
        <SkeletonBox width={90} height={10} radius={5} />
      </View>
      <View style={styles.countsRow}>
        <View style={styles.countBlock}>
          <SkeletonBox width={28} height={12} radius={6} />
          <SkeletonBox width={56} height={10} radius={5} />
        </View>
        <View style={styles.countBlock}>
          <SkeletonBox width={28} height={12} radius={6} />
          <SkeletonBox width={56} height={10} radius={5} />
        </View>
      </View>
    </SkeletonGroup>
  );
}
