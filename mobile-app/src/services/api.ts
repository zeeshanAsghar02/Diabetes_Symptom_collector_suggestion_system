/**
 * API Client with Axios
 * Handles authentication, token refresh, and request/response interceptors
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getApiUrl, getRuntimeApiUrl, AUTH_CONFIG } from '@utils/constants';
import { secureStorage } from '@utils/storage';
import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

// Create axios instance — baseURL is overridden per-request in the interceptor below
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiUrl(), // initial value; overridden dynamically in request interceptor
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if a token refresh is in progress
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token + dynamic base URL
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Resolve the runtime API URL (AsyncStorage override > env var)
    config.baseURL = await getRuntimeApiUrl().then((url) =>
      // Strip the /api/v1 suffix since axios baseURL is the root + path is appended
      url
    );

    // Get token from secure storage
    const token = await secureStorage.getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const runtimeUrl = await getRuntimeApiUrl();
        const response = await axios.post(
          `${runtimeUrl}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
            timeout: 10000,
          }
        );

        const { accessToken } = response.data.data;

        // Save new token
        await secureStorage.setAccessToken(accessToken);

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Process queued requests
        processQueue(null, accessToken);

        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Token refresh failed - clear tokens and reject
        processQueue(refreshError as Error, null);
        isRefreshing = false;

        await secureStorage.clearAll();

        // Notify app to redirect to login (will be handled by Redux)
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Error Handler
 */
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    
    if (axiosError.response) {
      // Server responded with error
      const message = 
        axiosError.response.data?.message || 
        axiosError.response.data?.error ||
        'An error occurred';
      return message;
    } else if (axiosError.request) {
      // Request made but no response
      return 'Network error. Please check your connection.';
    }
  }
  
  return error?.message || 'An unexpected error occurred';
};

/**
 * Check if error is unauthorized
 */
export const isUnauthorizedError = (error: any): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 401;
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error: any): boolean => {
  return axios.isAxiosError(error) && !error.response;
};

/**
 * Build a fresh fetchBaseQuery using the current runtime URL.
 * Called on every RTK Query request so IP overrides take effect immediately.
 */
const buildRawBaseQuery = (baseUrl: string) =>
  fetchBaseQuery({
    baseUrl,
    prepareHeaders: async (headers) => {
      const token = await secureStorage.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
    credentials: 'include', // For refresh token cookies
  });

/**
 * Dynamic base query — resolves the API base URL from AsyncStorage on each call.
 * Falls back to the baked EXPO_PUBLIC_API_URL env var if no override is stored.
 * Also handles automatic token refresh on 401.
 * A 12-second AbortController timeout prevents hanging indefinitely when the
 * server is unreachable on a physical device.
 */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // LLM-backed generation endpoints need much longer timeouts (RAG + LLM can take 3-8 min on HF)
  const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url ?? '';
  const isGenerationEndpoint =
    requestUrl.includes('/monthly-diet-plan/generate') ||
    requestUrl.includes('/diet-plan/generate') ||
    requestUrl.includes('/exercise-plan/generate') ||
    requestUrl.includes('/lifestyle-tips/generate') ||
    requestUrl.includes('/assessment/diabetes') ||
    requestUrl.includes('/assessment/run');
  const TIMEOUT_MS = isGenerationEndpoint ? 900_000 : 30_000; // 15 min for LLM, 30 s otherwise
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Merge our abort signal into the request args
  const argsWithSignal: FetchArgs =
    typeof args === 'string'
      ? { url: args, signal: controller.signal }
      : { ...args, signal: controller.signal };

  try {
    // Resolve latest URL every request (picks up runtime overrides immediately)
    const runtimeUrl = await getRuntimeApiUrl();
    const rawBaseQuery = buildRawBaseQuery(runtimeUrl);

    let result = await rawBaseQuery(argsWithSignal, api, extraOptions);

    // Transform AbortError (timeout) into a clear FETCH_ERROR
    if (
      result.error &&
      result.error.status === 'FETCH_ERROR' &&
      (result.error.error ?? '').toLowerCase().includes('abort')
    ) {
      return {
        error: {
          status: 'FETCH_ERROR' as const,
          error: `Server unreachable at ${runtimeUrl} — check that the backend is running and the IP is correct.`,
        },
      };
    }

    if (result.error && result.error.status === 401) {
      // Attempt to refresh the token
      try {
        const refreshResponse = await axios.post(
          `${runtimeUrl}/auth/refresh-token`,
          {},
          { withCredentials: true, timeout: 10000 }
        );

        const newToken = refreshResponse.data?.data?.accessToken;

        if (newToken) {
          // Persist new token
          await secureStorage.setAccessToken(newToken);

          // Retry original request with new token (same runtime URL)
          result = await rawBaseQuery(argsWithSignal, api, extraOptions);
        } else {
          // Refresh succeeded but no token — clear auth state
          await secureStorage.clearAll();
        }
      } catch {
        // Refresh failed entirely — clear tokens so user gets redirected to login
        await secureStorage.clearAll();
      }
    }

    return result;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default apiClient;
