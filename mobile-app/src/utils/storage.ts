/**
 * Secure Storage Utilities
 * Uses Expo SecureStore for sensitive data (tokens)
 * Uses AsyncStorage for non-sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export { STORAGE_KEYS };

// Secure Store (for tokens)
export const secureStorage = {
  /**
   * Save access token securely
   */
  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error saving access token:', error);
      throw error;
    }
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  /**
   * Remove access token
   */
  async removeAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error removing access token:', error);
    }
  },

  /**
   * Save refresh token securely
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Remove refresh token
   */
  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error removing refresh token:', error);
    }
  },

  /**
   * Clear all secure data
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.removeAccessToken(),
        this.removeRefreshToken(),
      ]);
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  },
};

// Async Storage (for non-sensitive data)
export const storage = {
  /**
   * Save data to AsyncStorage
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get data from AsyncStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue == null) return null;

      try {
        return JSON.parse(jsonValue) as T;
      } catch (parseError) {
        // If legacy/corrupted data was written (e.g., invalid escape sequences),
        // clear it so it doesn't keep breaking reads.
        await AsyncStorage.removeItem(key);
        console.error(`Invalid JSON for ${key}; cleared corrupted value.`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove data from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  /**
   * Clear all AsyncStorage data
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },

  /**
   * Get multiple items
   */
  async multiGet(keys: string[]): Promise<Record<string, any>> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      const data: Record<string, any> = {};

      await Promise.all(
        result.map(async ([key, value]) => {
          if (!value) return;
          try {
            data[key] = JSON.parse(value);
          } catch (parseError) {
            // Clear corrupted value to prevent repeated parse failures.
            await AsyncStorage.removeItem(key);
            console.error(`Invalid JSON for ${key}; cleared corrupted value.`, parseError);
          }
        })
      );

      return data;
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return {};
    }
  },

  /**
   * Set multiple items
   */
  async multiSet(items: Record<string, any>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(items).map(
        ([key, value]) => [key, JSON.stringify(value)]
      );
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Error setting multiple items:', error);
      throw error;
    }
  },
};

// Combined storage utilities
export default {
  secure: secureStorage,
  async: storage,
};
