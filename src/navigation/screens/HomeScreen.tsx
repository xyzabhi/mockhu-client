import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { clearSession } from '../../api';
import { theme } from '../../presentation/theme/theme';
import { resetToRoute } from '../navigationRef';
import type { RootStackParamList } from '../types';

/**
 * Dummy home — replace with tabs / feed / drawer when ready.
 */
type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>
        You’re signed in. Build your real home UI here (tabs, lists, etc.).
      </Text>
      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
        onPress={() => navigation.navigate('ExamCategories')}
        accessibilityRole="button"
        accessibilityLabel="Browse exams"
        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      >
        <Text style={styles.secondaryButtonText}>Browse exams</Text>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.xxl,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: 24,
    alignSelf: 'flex-start',
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    backgroundColor: 'rgba(0, 210, 106, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonPressed: {
    opacity: 0.88,
  },
  secondaryButtonText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  logoutButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
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
