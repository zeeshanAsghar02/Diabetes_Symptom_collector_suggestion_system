/**
 * Profile API - RTK Query
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type {
  Profile,
  UserHabit,
  UpdateProfilePayload,
  CreateHabitPayload,
  UpdateHabitPayload,
  ApiResponse,
} from '@app-types/api';

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery,
  tagTypes: ['Profile', 'Habits'],
  endpoints: (builder) => ({
    getProfile: builder.query<ApiResponse<Profile>, void>({
      query: () => '/users/profile',
      providesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<ApiResponse<Profile>, UpdateProfilePayload>({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),

    getHabits: builder.query<ApiResponse<UserHabit[]>, void>({
      query: () => '/habits',
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Habits' as const, id: _id })), { type: 'Habits', id: 'LIST' }]
          : [{ type: 'Habits', id: 'LIST' }],
    }),

    createHabit: builder.mutation<ApiResponse<UserHabit>, CreateHabitPayload>({
      query: (data) => ({
        url: '/habits',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Habits', id: 'LIST' }],
    }),

    updateHabit: builder.mutation<ApiResponse<UserHabit>, { id: string; habit: UpdateHabitPayload }>({
      query: ({ id, habit }) => ({
        url: `/habits/${id}`,
        method: 'PUT',
        body: habit,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Habits', id }],
    }),

    deleteHabit: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/habits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Habits', id }],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetHabitsQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useDeleteHabitMutation,
} = profileApi;
