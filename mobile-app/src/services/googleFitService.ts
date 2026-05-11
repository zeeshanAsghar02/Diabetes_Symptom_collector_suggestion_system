/**
 * Google Fit Service
 *
 * Reads health data via Android Health Connect (Google Fit syncs to Health Connect).
 * Provides steps, distance, calories burned, sleep time, and heart rate.
 * Gracefully degrades when Health Connect is unavailable (e.g. Expo Go).
 */

import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';

// ── types ─────────────────────────────────────────────────

export interface FitRecord {
  timestamp: string; // ISO 8601
  value: number;
}

export type FitMetricKey =
  | 'steps'
  | 'distance'
  | 'calories_burned'
  | 'sleep_time'
  | 'heart_rate';

export const FIT_METRIC_KEYS: FitMetricKey[] = [
  'steps',
  'distance',
  'calories_burned',
  'sleep_time',
  'heart_rate',
];

// ── dynamic import ────────────────────────────────────────
// Health Connect is only available on Android with native modules.
// In Expo Go or iOS the require will fail — we fall back to null.

let HC: typeof import('react-native-health-connect') | null = null;

if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    HC = require('react-native-health-connect');
  } catch {
    // Native module not linked (Expo Go, iOS, etc.)
  }
}

// Health Connect SDK status codes (react-native-health-connect)
// 0: SDK_UNAVAILABLE (unknown/unavailable)
// 1: SDK_UNAVAILABLE_PROVIDER_NOT_INSTALLED
// 2: SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
// 3: SDK_AVAILABLE
export const HEALTH_CONNECT_SDK_STATUS = {
  SDK_UNAVAILABLE: 0,
  SDK_UNAVAILABLE_PROVIDER_NOT_INSTALLED: 1,
  SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2,
  SDK_AVAILABLE: 3,
} as const;

export type HealthConnectSdkStatus =
  (typeof HEALTH_CONNECT_SDK_STATUS)[keyof typeof HEALTH_CONNECT_SDK_STATUS];

// ── permission list ───────────────────────────────────────

const PERMISSIONS: Array<{
  accessType: 'read';
  recordType:
    | 'Steps'
    | 'Distance'
    | 'TotalCaloriesBurned'
    | 'SleepSession'
    | 'HeartRate';
}> = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'HeartRate' },
];

// ── service ───────────────────────────────────────────────

class GoogleFitService {
  private initialized = false;
  private readonly permissionTimeoutMs = 12000;
  private readonly useNativePermissionDialog = false;

  private getAppPackageId(): string {
    if (Platform.OS !== 'android') {
      return 'com.diabeteshealth.mobile';
    }

    return Application.applicationId || 'com.diabeteshealth.mobile';
  }

  /** Whether the Health Connect native module is linked. */
  get isModuleAvailable(): boolean {
    return HC !== null;
  }

  /** Initialize the SDK. Returns true on success. */
  async init(): Promise<boolean> {
    if (!HC) return false;
    if (this.initialized) return true;
    try {
      const ok = await HC.initialize();
      this.initialized = ok;
      return ok;
    } catch (error) {
      if (__DEV__) {
        // Keep a local trace for native init failures that do not propagate to UI.
        console.warn('[GoogleFit] Health Connect init failed', error);
      }
      return false;
    }
  }

  /** Check if Health Connect is available on this device. */
  async isAvailable(): Promise<boolean> {
    if (!HC) return false;
    try {
      const status = await HC.getSdkStatus();
      return status === HEALTH_CONNECT_SDK_STATUS.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }

  /** Returns raw Health Connect SDK availability status code (or null if unavailable). */
  async getSdkStatus(): Promise<HealthConnectSdkStatus | null> {
    if (!HC) return null;
    try {
      return (await HC.getSdkStatus()) as HealthConnectSdkStatus;
    } catch {
      return null;
    }
  }

  /** Request read permissions for all 5 fitness metrics. */
  async authorize(): Promise<boolean> {
    if (!HC) return false;
    try {
      const inited = await this.init();
      if (!inited) {
        return false;
      }

      const alreadyGranted = await this.hasPermissions();
      if (alreadyGranted) {
        return true;
      }

      // Some release APK/device combinations can crash in the native permission contract.
      // We use Health Connect's app-managed permission screen as a stable fallback path.
      if (!this.useNativePermissionDialog) {
        this.openSettings();
        return false;
      }

      const permissionPromise = HC.requestPermission(PERMISSIONS);
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          clearTimeout(timer);
          reject(new Error('Health Connect permission request timed out'));
        }, this.permissionTimeoutMs);
      });

      const granted = (await Promise.race([
        permissionPromise,
        timeoutPromise,
      ])) as Array<{ accessType: string; recordType: string }>;

      if (!Array.isArray(granted)) {
        return false;
      }

      return granted.length >= PERMISSIONS.length;
    } catch (error) {
      if (__DEV__) {
        console.warn('[GoogleFit] authorize failed', error);
      }
      return false;
    }
  }

  /** Check currently granted permissions. */
  async hasPermissions(): Promise<boolean> {
    if (!HC) return false;
    try {
      const granted = await HC.getGrantedPermissions();
      const grantedTypes = new Set(
        granted
          .filter((p: any) => 'recordType' in p)
          .map((p: any) => p.recordType as string),
      );
      return PERMISSIONS.every((p) => grantedTypes.has(p.recordType));
    } catch {
      return false;
    }
  }

  /** Open Health Connect settings. */
  openSettings(): void {
    try {
      if (HC?.openHealthConnectDataManagement) {
        HC.openHealthConnectDataManagement(this.getAppPackageId());
        return;
      }

      HC?.openHealthConnectSettings();
      return;
    } catch (error) {
      if (__DEV__) {
        console.warn('[GoogleFit] openHealthConnectSettings failed', error);
      }
    }

    // Last resort fallback to the Play Store listing.
    Linking.openURL('market://details?id=com.google.android.apps.healthdata')
      .catch(() =>
        Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'),
      )
      .catch(() => {});
  }

  // ── data readers ──────────────────────────────────────

  async getSteps(start: Date, end: Date): Promise<FitRecord[]> {
    if (!HC) return [];
    try {
      const { records } = await HC.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
      return records.map((r) => ({
        timestamp: r.startTime,
        value: r.count,
      }));
    } catch {
      return [];
    }
  }

  async getDistance(start: Date, end: Date): Promise<FitRecord[]> {
    if (!HC) return [];
    try {
      const { records } = await HC.readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
      return records.map((r) => ({
        timestamp: r.startTime,
        value: (r.distance as any).inKilometers ?? 0,
      }));
    } catch {
      return [];
    }
  }

  async getCaloriesBurned(start: Date, end: Date): Promise<FitRecord[]> {
    if (!HC) return [];
    try {
      const { records } = await HC.readRecords('TotalCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
      return records.map((r) => ({
        timestamp: r.startTime,
        value: (r.energy as any).inKilocalories ?? 0,
      }));
    } catch {
      return [];
    }
  }

  async getSleepTime(start: Date, end: Date): Promise<FitRecord[]> {
    if (!HC) return [];
    try {
      const { records } = await HC.readRecords('SleepSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
      return records.map((r) => {
        const s = new Date(r.startTime).getTime();
        const e = new Date(r.endTime).getTime();
        const hours = (e - s) / (1000 * 60 * 60);
        return { timestamp: r.startTime, value: parseFloat(hours.toFixed(1)) };
      });
    } catch {
      return [];
    }
  }

  async getHeartRate(start: Date, end: Date): Promise<FitRecord[]> {
    if (!HC) return [];
    try {
      const { records } = await HC.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
      // Flatten samples from all records
      const results: FitRecord[] = [];
      for (const r of records) {
        if (r.samples && Array.isArray(r.samples)) {
          for (const s of r.samples) {
            results.push({
              timestamp: s.time,
              value: s.beatsPerMinute,
            });
          }
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  // ── bulk readers ──────────────────────────────────────

  /**
   * Fetch all 5 metrics in parallel for the given date range.
   */
  async getAllMetrics(
    start: Date,
    end: Date,
  ): Promise<Record<FitMetricKey, FitRecord[]>> {
    const [steps, distance, calories, sleep, heartRate] = await Promise.all([
      this.getSteps(start, end),
      this.getDistance(start, end),
      this.getCaloriesBurned(start, end),
      this.getSleepTime(start, end),
      this.getHeartRate(start, end),
    ]);
    return {
      steps,
      distance,
      calories_burned: calories,
      sleep_time: sleep,
      heart_rate: heartRate,
    };
  }

  /**
   * Get latest (today's) value for each metric.
   * Steps / distance / calories are summed for the day.
   * Sleep is the most recent session duration.
   * Heart rate is the latest sample average.
   */
  async getLatestValues(): Promise<Record<FitMetricKey, number | null>> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const data = await this.getAllMetrics(startOfDay, now);

    const sum = (recs: FitRecord[]) =>
      recs.length > 0 ? recs.reduce((a, r) => a + r.value, 0) : null;

    const avg = (recs: FitRecord[]) =>
      recs.length > 0
        ? recs.reduce((a, r) => a + r.value, 0) / recs.length
        : null;

    const latest = (recs: FitRecord[]) =>
      recs.length > 0 ? recs[recs.length - 1].value : null;

    return {
      steps: sum(data.steps),
      distance: sum(data.distance),
      calories_burned: sum(data.calories_burned),
      sleep_time: latest(data.sleep_time),
      heart_rate: avg(data.heart_rate),
    };
  }
}

export const googleFitService = new GoogleFitService();
