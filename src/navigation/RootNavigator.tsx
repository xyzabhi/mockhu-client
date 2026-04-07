import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { hydrateSessionUserFromMe, loadPersistedSession, setReauthHandler } from '../api';
import { refreshTokens } from '../api/refreshCoordinator';
import * as sessionStore from '../api/sessionStore';
import { useThemeColors, useThemePreference } from '../presentation/theme/ThemeContext';
import { OnboardingDraftProvider } from '../features/onboarding/OnboardingDraftContext';
import { OnboardingLayout } from '../features/onboarding/OnboardingLayout';
import { AuthNavigator } from './AuthNavigator';
import {
  flushPendingNavigationReset,
  navigationRef,
  resetToRoute,
} from './navigationRef';
import { rootDestinationForSession } from './postAuthNavigation';
import { ExamCategoriesScreen } from '../features/exams/presentation/screens/ExamCategoriesScreen';
import { ExamCategoryExamsScreen } from '../features/exams/presentation/screens/ExamCategoryExamsScreen';
import { ExamDetailScreen } from '../features/exams/presentation/screens/ExamDetailScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { PostCommentsScreen } from './screens/PostCommentsScreen';
import { JobNotificationsScreen } from './screens/JobNotificationsScreen';
import { MatchingJobsScreen } from './screens/MatchingJobsScreen';
import { SuggestedUsersScreen } from './screens/SuggestedUsersScreen';
import { LegalInfoScreen, legalInfoTitle } from './screens/LegalInfoScreen';
import { TrendingScreen } from './screens/TrendingScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function OnboardingScreen() {
  return (
    <OnboardingDraftProvider>
      <OnboardingLayout
        onFinish={() => {
          resetToRoute('Main');
        }}
      />
    </OnboardingDraftProvider>
  );
}

async function resolveInitialRoute(): Promise<keyof RootStackParamList> {
  await loadPersistedSession();
  let snap = sessionStore.getSessionSnapshot();
  const refreshToken = await sessionStore.getRefreshToken();
  const accessToken = await sessionStore.getAccessToken();

  if (!refreshToken && !accessToken) {
    return 'Auth';
  }

  let didRefresh = false;
  if (sessionStore.isAccessTokenExpired() && refreshToken) {
    try {
      await refreshTokens();
      didRefresh = true;
    } catch {
      return 'Auth';
    }
    snap = sessionStore.getSessionSnapshot();
  }

  if (!snap.accessToken) {
    return 'Auth';
  }

  /** `TokenResponse.user` is often minimal; `/me` fills names — skip if refresh already hydrated. */
  if (!didRefresh) {
    await hydrateSessionUserFromMe();
  }

  return rootDestinationForSession();
}

export function RootNavigator() {
  const colors = useThemeColors();
  const { effectiveScheme } = useThemePreference();
  const navigationTheme = useMemo(() => {
    const base = effectiveScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.brand,
        background: colors.surface,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.borderSubtle,
        notification: colors.brand,
      },
    };
  }, [effectiveScheme, colors]);

  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    setReauthHandler(() => resetToRoute('Auth'));
    return () => setReauthHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const route = await resolveInitialRoute();
      if (!cancelled) {
        setInitialRoute(route);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (initialRoute == null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={flushPendingNavigationReset}
      theme={navigationTheme}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen
          name="SuggestedUsers"
          component={SuggestedUsersScreen}
          options={{
            headerShown: true,
            title: 'Suggested for you',
          }}
        />
        <Stack.Screen
          name="JobNotifications"
          component={JobNotificationsScreen}
          options={{ headerShown: true, title: 'Job notifications' }}
        />
        <Stack.Screen
          name="MatchingJobs"
          component={MatchingJobsScreen}
          options={{ headerShown: true, title: 'Matching jobs' }}
        />
        <Stack.Screen
          name="Trending"
          component={TrendingScreen}
          options={{ headerShown: true, title: 'Trending' }}
        />
        <Stack.Screen
          name="LegalInfo"
          component={LegalInfoScreen}
          options={({ route }) => ({
            headerShown: true,
            title: legalInfoTitle(route.params.kind),
          })}
        />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="PostComments"
          component={PostCommentsScreen}
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="ExamCategories"
          component={ExamCategoriesScreen}
          options={{ headerShown: true, title: 'Exams' }}
        />
        <Stack.Screen
          name="ExamCategory"
          component={ExamCategoryExamsScreen}
          options={{ headerShown: true, title: 'Category' }}
        />
        <Stack.Screen
          name="ExamDetail"
          component={ExamDetailScreen}
          options={{ headerShown: true, title: 'Exam' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
