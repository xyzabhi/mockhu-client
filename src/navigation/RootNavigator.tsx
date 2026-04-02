import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { loadPersistedSession, setReauthHandler } from '../api';
import { refreshTokens } from '../api/refreshCoordinator';
import * as sessionStore from '../api/sessionStore';
import { theme } from '../presentation/theme/theme';
import { OnboardingLayout } from '../features/onboarding/OnboardingLayout';
import { AuthNavigator } from './AuthNavigator';
import {
  flushPendingNavigationReset,
  navigationRef,
  resetToRoute,
} from './navigationRef';
import { rootDestinationForSession } from './postAuthNavigation';
import { HomeScreen } from './screens/HomeScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function OnboardingScreen() {
  return (
    <OnboardingLayout
      onFinish={() => {
        // Until an API marks onboarding complete + client refreshes tokens, finish sends user Home.
        resetToRoute('Home');
      }}
    />
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

  if (sessionStore.isAccessTokenExpired() && refreshToken) {
    try {
      await refreshTokens();
    } catch {
      return 'Auth';
    }
    snap = sessionStore.getSessionSnapshot();
  }

  if (!snap.accessToken) {
    return 'Auth';
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
        <Stack.Screen name="Home" component={HomeScreen} />
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
