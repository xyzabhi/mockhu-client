import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../features/onboarding/OnboardingLayout';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef, resetToRoute } from './navigationRef';
import { MainPlaceholderScreen } from './screens/MainPlaceholderScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function OnboardingScreen() {
  return (
    <OnboardingLayout onFinish={() => resetToRoute('Main')} />
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={MainPlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
