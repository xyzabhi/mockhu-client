import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  hydrateSessionUserFromMe,
  normalizeTokenUserProfile,
  useFollowCounts,
  useSession,
} from '../../api';
import { resolveLevelBadgeFromUser } from '../../badge/progressionDisplay';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { ProfileAvatarUploader } from '../../features/profile/components/ProfileAvatarUploader';
import { LevelBadge } from '../../shared/components/LevelBadge';
import { SpecialBadgesRow } from '../../shared/components/SpecialBadgesRow';
import { SuggestedForYouSection } from '../../shared/components/SuggestedForYouSection';
import type { RootStackParamList } from '../types';
/** Matches ~`lineFontSize` × 1.38 cap on `LevelBadge` + row gap. */
const LEVEL_BADGE_WIDTH_APPROX = 40;

export function ProfileScreen() {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);
  const { user } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          await hydrateSessionUserFromMe({ includeInterests: false });
        } catch {
          /* offline / 401 */
        }
        if (cancelled) return;
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const profile = user ? normalizeTokenUserProfile(user) : null;
  const userId = profile?.id?.trim();
  const { followersCount, followingCount, loading: countsLoading, refresh: refreshCounts } =
    useFollowCounts(userId);
  const firstName = profile?.first_name?.trim() ?? '';
  const lastName = profile?.last_name?.trim() ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const username = profile?.username?.trim() ?? '';

  const levelBadge = profile ? resolveLevelBadgeFromUser(profile) : null;
  const hasLevelBadge = levelBadge != null;
  const nameMaxWidth = useMemo(() => {
    const pad = theme.spacing.screenPaddingH * 2;
    if (!hasLevelBadge) {
      return Math.max(120, windowWidth - pad);
    }
    return Math.max(120, windowWidth - pad - LEVEL_BADGE_WIDTH_APPROX - 8);
  }, [windowWidth, hasLevelBadge]);
  const specialBadges = profile?.special_badges ?? [];
  const openFollowList = useCallback(
    (kind: 'followers' | 'following') => {
      if (!userId) return;
      navigation.navigate('FollowList', { userId, kind });
    },
    [navigation, userId],
  );

  useFocusEffect(
    useCallback(() => {
      refreshCounts();
    }, [refreshCounts]),
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) return undefined;
      const tabParent = parent as unknown as {
        addListener: (event: 'tabPress', cb: (e: { target?: string }) => void) => () => void;
      };
      return tabParent.addListener('tabPress', (e) => {
        if (e.target === route.key) {
          refreshCounts();
        }
      });
    }, [navigation, route.key, refreshCounts]),
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarRow}>
        <ProfileAvatarUploader
          seed={userId ?? (username || 'profile')}
          avatarUrl={profile?.avatar_url}
          avatarUrls={profile?.avatar_urls}
          uploadEnabled
        />
      </View>
      <View style={styles.nameRow}>
        <View style={styles.nameRowLeft}>
          <Text
            style={[styles.welcomeHeadline, { maxWidth: nameMaxWidth }]}
            accessibilityRole="header"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {fullName ? fullName : 'Profile'}
          </Text>
          {hasLevelBadge && levelBadge ? (
            <LevelBadge
              level={levelBadge.level}
              tier={levelBadge.tierLabel}
              tierColorHint={profile?.tier_color_hint}
              lineFontSize={theme.fontSizes.screenTitle}
              style={styles.levelBadgeInline}
            />
          ) : null}
        </View>
      </View>
      {username ? (
        <Text style={styles.usernameLine} accessibilityLabel={`Username ${username}`}>
          @{username}
        </Text>
      ) : (
        <Text style={styles.muted}>Add a username in settings when available.</Text>
      )}

      {userId ? (
        <View style={styles.countsRow} accessibilityRole="summary">
          <Pressable
            style={({ pressed }) => [styles.countBlock, pressed && styles.countBlockPressed]}
            onPress={() => openFollowList('followers')}
            accessibilityRole="button"
            accessibilityLabel={`Open followers list, ${followersCount ?? 0}`}
          >
            <Text style={styles.countValue} accessibilityLabel={`Followers ${followersCount ?? 0}`}>
              {countsLoading ? '—' : String(followersCount ?? 0)}
            </Text>
            <Text style={styles.countLabel}>Followers</Text>
          </Pressable>
          <View style={styles.countDivider} />
          <Pressable
            style={({ pressed }) => [styles.countBlock, pressed && styles.countBlockPressed]}
            onPress={() => openFollowList('following')}
            accessibilityRole="button"
            accessibilityLabel={`Open following list, ${followingCount ?? 0}`}
          >
            <Text style={styles.countValue} accessibilityLabel={`Following ${followingCount ?? 0}`}>
              {countsLoading ? '—' : String(followingCount ?? 0)}
            </Text>
            <Text style={styles.countLabel}>Following</Text>
          </Pressable>
        </View>
      ) : null}

      {specialBadges.length > 0 ? <SpecialBadgesRow codes={specialBadges} /> : null}

      <SuggestedForYouSection />
    </ScrollView>
  );
}

function createProfileStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingBottom: 32,
    },
    avatarRow: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 18,
    },
    nameRow: {
      alignSelf: 'stretch',
    },
    nameRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: 8,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    welcomeHeadline: {
      flexShrink: 1,
      minWidth: 0,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      color: colors.textPrimary,
      letterSpacing: -0.3,
      lineHeight: 28,
    },
    levelBadgeInline: {
      marginLeft: 0,
      flexShrink: 0,
    },
    usernameLine: {
      marginTop: 6,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textMuted,
    },
    muted: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
    },
    countsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 22,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    countBlock: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      borderRadius: 12,
    },
    countBlockPressed: {
      opacity: 0.72,
    },
    countValue: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xl,
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    countLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    countDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.borderSubtle,
    },
  });
}
