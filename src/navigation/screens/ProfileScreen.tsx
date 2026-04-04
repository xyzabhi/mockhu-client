import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { clearSession, normalizeTokenUserProfile, useSession } from '../../api';
import { theme } from '../../presentation/theme/theme';
import { resetToRoute } from '../navigationRef';
import type { RootStackParamList } from '../types';

export function ProfileScreen() {
  const navigation = useNavigation();
  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profile = user ? normalizeTokenUserProfile(user) : null;
  const firstName = profile?.first_name?.trim() ?? '';
  const lastName = profile?.last_name?.trim() ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const username = profile?.username?.trim() ?? '';

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
    <View style={styles.root}>
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

      <Pressable
        style={({ pressed }) => [styles.primaryCta, pressed && styles.primaryCtaPressed]}
        onPress={() => rootNav?.navigate('ExamCategories')}
        accessibilityRole="button"
        accessibilityLabel="Browse exams"
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <Text style={styles.primaryCtaText}>Browse exams</Text>
      </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 24,
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
