import axios from 'axios';
import { getApiBaseUrl } from '../config/apiBase';

const API_URL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`
});

// Request interceptor: Attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global refresh state — ensures only ONE refresh runs at a time across all concurrent requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: Handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip redirect and token refresh for public paths or when no token exists
    const publicPaths = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/logout', '/public', '/diseases/public', '/symptoms/public'];
    const isPublicPath = publicPaths.some(path => originalRequest?.url?.includes(path));
    const hasToken = localStorage.getItem('accessToken');

    // Only attempt refresh if: 401 error, not already retried, not public path, has token
    if (error.response?.status === 401 && !originalRequest?._retry && !isPublicPath && hasToken) {
      if (isRefreshing) {
        // Another refresh is already in flight — wait for it to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, {}, { 
          withCredentials: true,
          timeout: 10000 // 10 second timeout for refresh
        });
        
        if (res.data?.data?.accessToken) {
          const newToken = res.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } else {
          // Server returned success but no token — treat as failure
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        console.warn('Token refresh failed:', refreshError?.message || refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear auth state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('roles');
        
        // Redirect only if not already on signin page
        if (!window.location.pathname.includes('/signin') && !window.location.pathname.includes('/signup')) {
          window.location.href = '/signin';
        }
        
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
