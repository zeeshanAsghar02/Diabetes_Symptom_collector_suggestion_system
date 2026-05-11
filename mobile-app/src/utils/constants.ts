/**
 * Constants and Configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://zeeshanasghar02-diavise-backend.hf.space',
  API_VERSION: '/api/v1',
  TIMEOUT: 30000, // 30 seconds
};

/**
 * Auto-detects the best API base URL for the current platform.
 * Used as a fallback when no AsyncStorage override is saved.
 *
 * Uses Device.isDevice to distinguish physical devices from emulators/simulators.
 * IMPORTANT: Platform.OS === 'android' is true on BOTH real devices AND emulators,
 * so we cannot use Platform alone — Device.isDevice is required.
 *
 * Priority:
 *   Emulator/Simulator → 10.0.2.2 (Android) or localhost (iOS) maps to host machine
 *   Physical device    → EXPO_PUBLIC_API_URL from .env (set once via Dev Settings)
 */
const getAutoDetectedUrl = (): string => {
  // Device.isDevice === false means we're in an emulator or simulator
  // For cloud backend: emulators can also reach the HF Space, so we use env URL for all cases
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}`;
};

/** Sync getter — returns the baked-in env value. Used for initial axios instance creation. */
export const getApiUrl = () => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}`;
};

const RUNTIME_URL_KEY = '@diavise_api_base_url';

/**
 * ASYNC — always use this for actual API calls.
 *
 * Priority chain:
 *   1. AsyncStorage override  (set via Dev Settings screen — no rebuild needed)
 *   2. Platform auto-detect   (Android Emulator → 10.0.2.2, iOS Sim → localhost)
 *   3. EXPO_PUBLIC_API_URL    (baked .env value — physical device last resort)
 */
export const getRuntimeApiUrl = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(RUNTIME_URL_KEY);
    if (stored && stored.startsWith('http')) {
      // Stored value is the full URL including /api/v1
      return stored;
    }
  } catch {
    // AsyncStorage unavailable — fall through to auto-detect
  }
  return getAutoDetectedUrl();
};

/**
 * Check whether the URL is currently from a manual AsyncStorage override.
 * Used by Dev Settings screen to show the override status badge.
 */
export const isRuntimeUrlOverridden = async (): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(RUNTIME_URL_KEY);
    return !!stored && stored.startsWith('http');
  } catch {
    return false;
  }
};

/**
 * Persist a full API URL including /api/v1
 * (e.g. "http://192.168.1.50:5000/api/v1").
 * The Dev Settings screen passes the full URL after appending the version suffix.
 */
export const setRuntimeApiUrl = async (fullUrl: string): Promise<void> => {
  const trimmed = fullUrl.trim().replace(/\/$/, '');
  await AsyncStorage.setItem(RUNTIME_URL_KEY, trimmed);
};

/** Remove override — getRuntimeApiUrl will fall back to auto-detect then .env. */
export const resetRuntimeApiUrl = async (): Promise<void> => {
  await AsyncStorage.removeItem(RUNTIME_URL_KEY);
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  THEME_MODE: 'themeMode',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  PENDING_ONBOARDING_ANSWERS: 'pendingOnboardingAnswers',
  LAST_SYNC: 'lastSync',
  OFFLINE_QUEUE: 'offlineQueue',
  /** Set to 'true' after every login so the diagnosis check popup fires once on the next dashboard mount */
  SHOW_DIAGNOSIS_POPUP: '@diavise_show_diagnosis_popup',
};

// Authentication
export const AUTH_CONFIG = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 min before expiry
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Validation
export const VALIDATION = {
  MIN_AGE: 11,
  MIN_PASSWORD_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_REGEX: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
};

// Disease Data Editing Window
export const DISEASE_DATA = {
  EDITING_WINDOW_HOURS: 24,
};

// Plan History Limits
export const HISTORY_LIMITS = {
  DIET_PLANS: 30,
  EXERCISE_PLANS: 30,
  MONTHLY_DIET_PLANS: 12,
  ASSESSMENTS: 10,
};

// Sync Configuration
export const SYNC_CONFIG = {
  BACKGROUND_INTERVAL: 15 * 60 * 1000, // 15 minutes
  RETRY_DELAY: 5000,
  MAX_QUEUE_SIZE: 100,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  DIET_REMINDER_TIME: { hour: 8, minute: 0 }, // 8:00 AM
  EXERCISE_REMINDER_TIME: { hour: 18, minute: 0 }, // 6:00 PM
  LIFESTYLE_REMINDER_TIME: { hour: 9, minute: 0 }, // 9:00 AM
};

// Chart Colors (matching web)
export const CHART_COLORS = {
  CARBS: '#2563eb',
  PROTEIN: '#4caf50',
  FAT: '#ff9800',
  CALORIES: '#f44336',
  CARDIO: '#2196f3',
  STRENGTH: '#9c27b0',
  FLEXIBILITY: '#00bcd4',
  BALANCE: '#8bc34a',
};

// Risk Levels
export const RISK_LEVELS = {
  HIGH: {
    label: 'High Risk',
    color: '#f44336',
    threshold: 0.7,
  },
  MEDIUM: {
    label: 'Medium Risk',
    color: '#ff9800',
    threshold: 0.4,
  },
  LOW: {
    label: 'Low Risk',
    color: '#4caf50',
    threshold: 0,
  },
};

// Activity Levels
export const ACTIVITY_LEVELS = [
  { value: 'Sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'Lightly Active', label: 'Lightly Active (1-3 days/week)' },
  { value: 'Moderately Active', label: 'Moderately Active (3-5 days/week)' },
  { value: 'Very Active', label: 'Very Active (6-7 days/week)' },
  { value: 'Extra Active', label: 'Extra Active (intense exercise daily)' },
];

// Diabetes Types
export const DIABETES_TYPES = [
  { value: 'Type 1', label: 'Type 1 Diabetes' },
  { value: 'Type 2', label: 'Type 2 Diabetes' },
  { value: 'Gestational', label: 'Gestational Diabetes' },
  { value: 'Prediabetes', label: 'Prediabetes' },
];

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

// Lifestyle Categories
export const LIFESTYLE_CATEGORIES = [
  { value: 'Nutrition', label: 'Nutrition', icon: '🥗' },
  { value: 'Exercise', label: 'Exercise', icon: '💪' },
  { value: 'Medication', label: 'Medication', icon: '💊' },
  { value: 'Monitoring', label: 'Monitoring', icon: '🩺' },
  { value: 'Mental Health', label: 'Mental Health', icon: '🧘' },
  { value: 'Sleep', label: 'Sleep', icon: '😴' },
];

// Feedback Categories
export const FEEDBACK_CATEGORIES = [
  { value: 'ui_ux', label: 'UI/UX' },
  { value: 'features', label: 'Features' },
  { value: 'performance', label: 'Performance' },
  { value: 'support', label: 'Support' },
  { value: 'content', label: 'Content Quality' },
];

export default {
  API_CONFIG,
  STORAGE_KEYS,
  AUTH_CONFIG,
  VALIDATION,
  DISEASE_DATA,
  HISTORY_LIMITS,
  SYNC_CONFIG,
  NOTIFICATION_CONFIG,
  CHART_COLORS,
  RISK_LEVELS,
  ACTIVITY_LEVELS,
  DIABETES_TYPES,
  GENDER_OPTIONS,
  LIFESTYLE_CATEGORIES,
  FEEDBACK_CATEGORIES,
};
