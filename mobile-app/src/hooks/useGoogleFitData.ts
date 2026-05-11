/**
 * useGoogleFitData
 *
 * React hook that provides Google Fit (Health Connect) data to components.
 * Returns per-metric history arrays and latest values.
 * Gracefully returns empty data when Health Connect is unavailable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  googleFitService,
  FIT_METRIC_KEYS,
  type FitRecord,
  type FitMetricKey,
  HEALTH_CONNECT_SDK_STATUS,
  type HealthConnectSdkStatus,
} from '@services/googleFitService';

// ── types ─────────────────────────────────────────────────

export interface GoogleFitState {
  /** Whether Health Connect native module is linked (false in Expo Go / iOS). */
  isModuleAvailable: boolean;
  /** Whether Health Connect SDK is available on this device. */
  isAvailable: boolean;
  /** Raw Health Connect SDK status code (null if module unavailable). */
  sdkStatus: HealthConnectSdkStatus | null;
  /** Whether all required read permissions are granted. */
  isAuthorized: boolean;
  /** Loading indicator for initial data fetch. */
  isLoading: boolean;
  /** Per-metric history records. */
  data: Record<FitMetricKey, FitRecord[]>;
  /** Latest (today) value per metric. */
  latestValues: Record<FitMetricKey, number | null>;
  /** Request Health Connect permissions. */
  authorize: () => Promise<boolean>;
  /** Open Health Connect settings (Android only). */
  openSettings: () => void;
  /** Re-fetch all data. */
  refresh: () => Promise<void>;
}

// ── defaults ──────────────────────────────────────────────

const EMPTY_DATA: Record<FitMetricKey, FitRecord[]> = {
  steps: [],
  distance: [],
  calories_burned: [],
  sleep_time: [],
  heart_rate: [],
};

const EMPTY_LATEST: Record<FitMetricKey, number | null> = {
  steps: null,
  distance: null,
  calories_burned: null,
  sleep_time: null,
  heart_rate: null,
};

// ── hook ──────────────────────────────────────────────────

export function useGoogleFitData(
  range: 'weekly' | 'monthly' = 'weekly',
): GoogleFitState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkStatus, setSdkStatus] = useState<HealthConnectSdkStatus | null>(null);
  const [data, setData] = useState<Record<FitMetricKey, FitRecord[]>>(EMPTY_DATA);
  const [latestValues, setLatestValues] = useState<Record<FitMetricKey, number | null>>(EMPTY_LATEST);
  const mountedRef = useRef(true);

  const isModuleAvailable = googleFitService.isModuleAvailable;

  const fetchData = useCallback(async () => {
    if (!isModuleAvailable) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1 — check availability
      const status = await googleFitService.getSdkStatus();
      if (!mountedRef.current) return;
      setSdkStatus(status);

      const available = status === HEALTH_CONNECT_SDK_STATUS.SDK_AVAILABLE;
      if (!mountedRef.current) return;
      setIsAvailable(available);
      if (!available) {
        setIsLoading(false);
        return;
      }

      // 2 — initialise SDK
      const inited = await googleFitService.init();
      if (!inited || !mountedRef.current) {
        setIsLoading(false);
        return;
      }

      // 3 — check permissions
      const hasPerms = await googleFitService.hasPermissions();
      if (!mountedRef.current) return;
      setIsAuthorized(hasPerms);

      if (!hasPerms) {
        setIsLoading(false);
        return;
      }

      // 4 — fetch history
      const now = new Date();
      const daysBack = range === 'weekly' ? 7 : 28;
      const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const metrics = await googleFitService.getAllMetrics(start, now);
      if (!mountedRef.current) return;
      setData(metrics);

      // 5 — fetch latest values
      const latest = await googleFitService.getLatestValues();
      if (!mountedRef.current) return;
      setLatestValues(latest);
    } catch (error) {
      if (!mountedRef.current) return;
      setIsAvailable(false);
      setIsAuthorized(false);
      if (__DEV__) {
        console.warn('[GoogleFit] fetchData failed', error);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [range, isModuleAvailable]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const authorize = useCallback(async (): Promise<boolean> => {
    try {
      const result = await googleFitService.authorize();
      if (mountedRef.current) {
        setIsAuthorized(result);
        if (result) await fetchData();
      }
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setIsAuthorized(false);
      }
      if (__DEV__) {
        console.warn('[GoogleFit] authorize hook failed', error);
      }
      return false;
    }
  }, [fetchData]);

  return {
    isModuleAvailable,
    isAvailable,
    sdkStatus,
    isAuthorized,
    isLoading,
    data,
    latestValues,
    authorize,
    openSettings: () => googleFitService.openSettings(),
    refresh: fetchData,
  };
}
