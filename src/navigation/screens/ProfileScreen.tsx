import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  clearSession,
  normalizeTokenUserProfile,
  useFollowCounts,
  useSession,
} from '../../api';
import { theme } from '../../presentation/theme/theme';
import { SuggestedForYouSection } from '../../shared/components/SuggestedForYouSection';
import { UserAvatar } from '../../shared/components/UserAvatar';
import { formatCompactCount } from '../../shared/utils/formatCompactCount';
import { resetToRoute } from '../navigationRef';

export function ProfileScreen() {
  const { user } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profile = user ? normalizeTokenUserProfile(user) : null;
  const userId = profile?.id?.trim();
  const { followersCount, followingCount, loading: countsLoading } =
    useFollowCounts(userId);
  const firstName = profile?.first_name?.trim() ?? '';
  const lastName = profile?.last_name?.trim() ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const username = profile?.username?.trim() ?? '';
  const xp =
    typeof profile?.xp === 'number' && Number.isFinite(profile.xp) ? profile.xp : 0;

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
      <Text style={styles.welcomeHeadline} accessibilityRole="header">
        {fullName ? fullName : 'Profile'}
      </Text>
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
          <View style={styles.countDivider} />
          <View style={styles.countBlock}>
            <Text
              style={styles.countValueXp}
              accessibilityLabel={`Experience points ${xp}`}
            >
              {formatCompactCount(xp)}
            </Text>
            <Text style={styles.countLabel}>XP</Text>
          </View>
        </View>
      ) : null}

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
          <ActivityIndicator size="small" color={theme.colors.textPrimary} />
        ) : (
          <Text style={styles.logoutButtonText}>Log out</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
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
  welcomeHeadline: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  usernameLine: {
    marginTop: 6,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.lg,
    color: theme.colors.textMuted,
  },
  muted: {
    marginTop: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  countBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  countValue: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xl,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  countValueXp: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xl,
    color: theme.colors.progress,
    fontVariant: ['tabular-nums'],
  },
  countLabel: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fontSizes.meta,
    color: theme.colors.textMuted,
  },
  countDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.borderSubtle,
  },
  primaryCta: {
    marginTop: 28,
    alignSelf: 'flex-start',
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.button,
    borderWidth: 0,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryCtaPressed: {
    opacity: 0.88,
  },
  primaryCtaText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.onBrand,
  },
  logoutButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.textPrimary,
  },
});
