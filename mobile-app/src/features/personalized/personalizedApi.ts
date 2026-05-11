/**
 * Personalized System API - RTK Query
 * Personal info, medical info, and diabetes diagnosis management
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { PersonalInfo, MedicalInfo, ApiResponse } from '@app-types/api';

export const personalizedApi = createApi({
  reducerPath: 'personalizedApi',
  baseQuery,
  tagTypes: ['PersonalInfo', 'MedicalInfo'],
  endpoints: (builder) => ({
    getPersonalInfo: builder.query<ApiResponse<PersonalInfo>, void>({
      query: () => '/personalized-system/personal-info',
      providesTags: ['PersonalInfo'],
    }),

    savePersonalInfo: builder.mutation<ApiResponse<PersonalInfo>, Partial<PersonalInfo>>({
      query: (data) => ({
        url: '/personalized-system/personal-info',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PersonalInfo'],
    }),

    getMedicalInfo: builder.query<ApiResponse<MedicalInfo>, void>({
      query: () => '/personalized-system/medical-info',
      providesTags: ['MedicalInfo'],
    }),

    saveMedicalInfo: builder.mutation<ApiResponse<MedicalInfo>, Partial<MedicalInfo>>({
      query: (data) => ({
        url: '/personalized-system/medical-info',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MedicalInfo'],
    }),

    updateDiabetesDiagnosis: builder.mutation<
      ApiResponse<{ diabetes_diagnosed: string; diabetes_diagnosed_answered_at: string }>,
      { diabetes_diagnosed: 'yes' | 'no' }
    >({
      query: (data) => ({
        url: '/personalized-system/diabetes-diagnosis',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetPersonalInfoQuery,
  useSavePersonalInfoMutation,
  useGetMedicalInfoQuery,
  useSaveMedicalInfoMutation,
  useUpdateDiabetesDiagnosisMutation,
} = personalizedApi;
