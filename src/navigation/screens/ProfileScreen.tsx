import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  clearSession,
  hydrateSessionUserFromMe,
  normalizeTokenUserProfile,
  useFollowCounts,
  useSession,
} from '../../api';
import { resolveLevelBadgeFromUser } from '../../badge/progressionDisplay';
import { theme } from '../../presentation/theme/theme';
import { ThemeAppearanceToggle } from '../../presentation/theme/ThemeAppearanceToggle';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { LevelBadge } from '../../shared/components/LevelBadge';
import { SpecialBadgesRow } from '../../shared/components/SpecialBadgesRow';
import { SuggestedForYouSection } from '../../shared/components/SuggestedForYouSection';
import { UserAvatar } from '../../shared/components/UserAvatar';
import { resetToRoute } from '../navigationRef';

/** Matches ~`lineFontSize` × 1.38 cap on `LevelBadge` + row gap. */
const LEVEL_BADGE_WIDTH_APPROX = 40;

export function ProfileScreen() {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);
  const { user } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  const { followersCount, followingCount, loading: countsLoading } =
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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await clearSession();
      resetToRoute('Auth');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarRow}>
        <UserAvatar
          seed={userId ?? (username || 'profile')}
          avatarUrl={profile?.avatar_url}
          size={88}
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
          <View style={styles.countBlock}>
            <Text style={styles.countValue} accessibilityLabel={`Followers ${followersCount ?? 0}`}>
              {countsLoading ? '—' : String(followersCount ?? 0)}
            </Text>
            <Text style={styles.countLabel}>Followers</Text>
          </View>
          <View style={styles.countDivider} />
          <View style={styles.countBlock}>
            <Text style={styles.countValue} accessibilityLabel={`Following ${followingCount ?? 0}`}>
              {countsLoading ? '—' : String(followingCount ?? 0)}
            </Text>
            <Text style={styles.countLabel}>Following</Text>
          </View>
        </View>
      ) : null}

      {specialBadges.length > 0 ? <SpecialBadgesRow codes={specialBadges} /> : null}

      <ThemeAppearanceToggle />

      <SuggestedForYouSection />

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
          isLoggingOut && styles.logoutButtonDisabled,
        ]}
        onPress={() => void handleLogout()}
        disabled={isLoggingOut}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <Text style={styles.logoutButtonText}>Log out</Text>
        )}
      </Pressable>
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
      marginTop: 8,
      marginBottom: 16,
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
      marginTop: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: theme.radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    countBlock: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
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
    logoutButton: {
      marginTop: 16,
      alignSelf: 'flex-start',
      minWidth: 140,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    logoutButtonPressed: {
      opacity: 0.88,
    },
    logoutButtonDisabled: {
      opacity: 0.6,
    },
    logoutButtonText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
  });
}
