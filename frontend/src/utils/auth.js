import axiosInstance from './axiosInstance';

// NOTE: Token refresh is handled centrally by axiosInstance.js interceptor (with mutex).
// Do NOT add a duplicate interceptor here — it causes infinite refresh loops.

export async function logout() {
  try {
    await axiosInstance.get(`/auth/logout`, { withCredentials: true });
  } catch (err) {
    // Ignore errors — user is logging out anyway
    console.warn('Logout request failed (ignored):', err?.message);
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('roles');
}

export async function getCurrentUser() {
  try {
    const res = await axiosInstance.get(`/auth/profile`);
    console.log('Current user fetched successfully:', res.data.data.user);
    return res.data.data.user;
  } catch (err) {
    console.error('Error fetching current user:', err);
    throw err;
  }
} 
