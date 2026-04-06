import { Platform } from 'react-native';

const STORAGE_KEY = '@mockhu/themePreference';

export type StoredThemePreference = 'light' | 'dark' | 'system';

function parse(raw: string | null): StoredThemePreference | null {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return null;
}

/**
 * Theme preference persistence. Web uses `localStorage`; native uses AsyncStorage.
 * If native storage is unavailable (misconfigured build), reads/writes fail silently.
 */
function webStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export async function getStoredThemePreference(): Promise<StoredThemePreference | null> {
  try {
    if (Platform.OS === 'web') {
      const ls = webStorage();
      return ls ? parse(ls.getItem(STORAGE_KEY)) : null;
    }
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return parse(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function setStoredThemePreference(next: StoredThemePreference): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const ls = webStorage();
      if (ls) ls.setItem(STORAGE_KEY, next);
      return;
    }
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore — preference still applies in memory for this session */
  }
}
