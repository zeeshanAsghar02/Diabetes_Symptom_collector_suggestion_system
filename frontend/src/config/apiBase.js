const DEFAULT_API_BASE_URL = 'http://localhost:5000';

export const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;
  return rawUrl.replace(/\/+$/, '');
};

