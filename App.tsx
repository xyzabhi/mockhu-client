import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { interFontMap } from './src/presentation/theme/interFontMap';
import { ThemeProvider, useThemeColors } from './src/presentation/theme/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppShell() {
  const colors = useThemeColors();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface }}
      /** Bottom inset is applied by the tab bar only — avoid double margin with `edges.bottom`. */
      edges={['left', 'right']}
    >
      <RootNavigator />
    </SafeAreaView>
  );
}

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
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
