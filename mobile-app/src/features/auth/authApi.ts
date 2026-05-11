/**
 * Auth API
 * RTK Query endpoints for authentication
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ApiResponse,
  User,
} from '@app-types/api';
import { baseQuery } from '@services/api';
import { secureStorage } from '@utils/storage';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Save token to secure storage
          if (data.data.accessToken) {
            await secureStorage.setAccessToken(data.data.accessToken);
          }
        } catch (error) {
          console.error('Login error:', error);
        }
      },
      invalidatesTags: ['User'],
    }),

    // Register
    register: builder.mutation<ApiResponse<LoginResponse>, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // Get current user
    getCurrentUser: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),

    // Logout
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'GET',
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear tokens from secure storage
          await secureStorage.clearAll();
        } catch (error) {
          console.error('Logout error:', error);
          // Clear tokens even on error
          await secureStorage.clearAll();
        }
      },
      invalidatesTags: ['User'],
    }),

    // Activate account
    activateAccount: builder.mutation<ApiResponse<void>, string>({
      query: (token) => ({
        url: `/auth/activate/${token}`,
        method: 'GET',
      }),
    }),

    // Resend activation email
    resendActivation: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/auth/resend-activation',
        method: 'POST',
      }),
    }),

    // Forgot password
    forgotPassword: builder.mutation<ApiResponse<void>, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<ApiResponse<null>, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'POST',
        body: { password },
      }),
    }),

    // Change password
    changePassword: builder.mutation<ApiResponse<null>, { oldPassword: string; newPassword: string }>({
      query: (credentials) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Refresh token
    refreshToken: builder.mutation<ApiResponse<{ accessToken: string }>, void>({
      query: () => ({
        url: '/auth/refresh-token',
        method: 'POST',
        credentials: 'include',
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data.accessToken) {
            await secureStorage.setAccessToken(data.data.accessToken);
          }
        } catch (error) {
          console.error('Token refresh error:', error);
        }
      },
    }),

    // Update diagnosis status
    updateDiagnosisStatus: builder.mutation<
      ApiResponse<User>,
      { diabetes_diagnosed: 'yes' | 'no' }
    >({
      query: (body) => ({
        url: '/personalized-system/diabetes-diagnosis',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useActivateAccountMutation,
  useResendActivationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useRefreshTokenMutation,
  useUpdateDiagnosisStatusMutation,
} = authApi;
