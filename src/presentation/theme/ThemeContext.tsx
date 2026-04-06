import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { theme } from './theme';
import { getStoredThemePreference, setStoredThemePreference } from './themePreferenceStorage';

export type ThemeColors = typeof theme.colors;

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  /** Light/dark after applying preference and (when system) OS scheme. */
  effectiveScheme: 'light' | 'dark';
};

function resolveEffectiveScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): 'light' | 'dark' {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

const defaultThemeContext: ThemeContextValue = {
  colors: theme.colors,
  preference: 'system',
  setPreference: () => {},
  effectiveScheme: 'light',
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

/**
 * Resolves palette from stored preference (light / dark / system) and OS appearance.
 * Wrap the app (inside `SafeAreaProvider`) with `ThemeProvider`.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    void getStoredThemePreference().then((stored) => {
      if (stored) setPreferenceState(stored);
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void setStoredThemePreference(next);
  }, []);

  const effectiveScheme = useMemo(
    () => resolveEffectiveScheme(preference, systemScheme),
    [preference, systemScheme],
  );

  const colors = useMemo<ThemeColors>(
    () =>
      effectiveScheme === 'dark' ? (theme.colorsDark as ThemeColors) : theme.colors,
    [effectiveScheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, preference, setPreference, effectiveScheme }),
    [colors, preference, setPreference, effectiveScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}

export function useThemePreference(): Pick<
  ThemeContextValue,
  'preference' | 'setPreference' | 'effectiveScheme'
> {
  const ctx = useContext(ThemeContext);
  return {
    preference: ctx.preference,
    setPreference: ctx.setPreference,
    effectiveScheme: ctx.effectiveScheme,
  };
}
