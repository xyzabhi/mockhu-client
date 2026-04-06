import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { interFontMap } from './src/presentation/theme/interFontMap';
import { theme } from './src/presentation/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts(interFontMap);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={['left', 'right', 'bottom']}
      >
        <RootNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
