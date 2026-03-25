import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WelcomeScreen from './src/features/auth/WelcomeScreen';
import { interFontMap } from './src/presentation/theme/interFontMap';

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
        style={{ flex: 1, backgroundColor: '#f6f8fc' }}
        edges={['top', 'left', 'right']}
      >
        <WelcomeScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
