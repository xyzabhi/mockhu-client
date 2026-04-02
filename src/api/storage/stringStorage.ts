import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const WEB_PREFIX = 'mockhu_secure_';

/**
 * Key/value strings: SecureStore on native; sessionStorage on web (dev convenience — not hardware-backed).
 */
export const stringStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof sessionStorage === 'undefined') return null;
      return sessionStorage.getItem(WEB_PREFIX + key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(WEB_PREFIX + key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(WEB_PREFIX + key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
