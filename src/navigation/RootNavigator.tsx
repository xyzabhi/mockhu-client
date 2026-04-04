import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { hydrateSessionUserFromMe, loadPersistedSession, setReauthHandler } from '../api';
import { refreshTokens } from '../api/refreshCoordinator';
import * as sessionStore from '../api/sessionStore';
import { theme } from '../presentation/theme/theme';
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
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function OnboardingScreen() {
  return (
    <OnboardingDraftProvider>
      <OnboardingLayout
        onFinish={() => {
          resetToRoute('Home');
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
      <View style={bootstrapStyles.root}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={flushPendingNavigationReset}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={MainTabNavigator} />
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

const bootstrapStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
