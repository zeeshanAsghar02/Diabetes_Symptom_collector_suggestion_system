/**
 * Exercise Plan API - RTK Query
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { 
  ExercisePlan, 
  GenerateExercisePlanRequest,
  ApiResponse 
} from '@app-types/api';

// Generation status response (fire-and-forget, mirrors MonthlyDietPlan pattern)
export interface ExercisePlanGenerationStatus {
  status: 'pending' | 'complete' | 'failed' | 'not_found';
  planId?: string;
  plan?: ExercisePlan;
  error?: string;
}

export const exercisePlanApi = createApi({
  reducerPath: 'exercisePlanApi',
  baseQuery,
  tagTypes: ['ExercisePlan'],
  endpoints: (builder) => ({
    generateExercisePlan: builder.mutation<ApiResponse<ExercisePlan>, GenerateExercisePlanRequest>({
      query: (data) => ({
        url: '/exercise-plan/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ExercisePlan'],
    }),

    /**
     * Ensure today's plan exists (fire-and-forget).
     * Returns { success, status: 'complete'|'pending', planId, plan? }
     */
    ensureTodayExercisePlan: builder.mutation<ExercisePlanGenerationStatus, void>({
      query: () => ({
        url: '/exercise-plan/ensure-today',
        method: 'POST',
      }),
      transformResponse: (res: any) => ({
        status:  res?.status ?? 'pending',
        planId:  res?.planId,
        plan:    res?.plan,
        error:   res?.error,
      }),
      invalidatesTags: ['ExercisePlan'],
    }),

    /**
     * Poll today's generation status.
     * Returns { success, status: 'pending'|'complete'|'failed'|'not_found', planId, plan? }
     */
    getExercisePlanStatusToday: builder.query<ExercisePlanGenerationStatus, void>({
      query: () => '/exercise-plan/status/today',
      transformResponse: (res: any) => ({
        status:  res?.status ?? 'not_found',
        planId:  res?.planId,
        plan:    res?.plan,
        error:   res?.error,
      }),
    }),

    getExercisePlans: builder.query<ApiResponse<ExercisePlan[]>, void>({
      query: () => '/exercise-plan',
      providesTags: ['ExercisePlan'],
    }),
    
    getExercisePlanById: builder.query<ApiResponse<ExercisePlan>, string>({
      query: (id) => `/exercise-plan/${id}`,
      providesTags: (result, error, id) => [{ type: 'ExercisePlan', id }],
    }),
    
    deleteExercisePlan: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/exercise-plan/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ExercisePlan'],
    }),
    
    downloadExercisePlanPDF: builder.mutation<Blob, string>({
      query: (id) => ({
        url: `/exercise-plan/${id}/download`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGenerateExercisePlanMutation,
  useEnsureTodayExercisePlanMutation,
  useGetExercisePlanStatusTodayQuery,
  useGetExercisePlansQuery,
  useGetExercisePlanByIdQuery,
  useDeleteExercisePlanMutation,
  useDownloadExercisePlanPDFMutation,
} = exercisePlanApi;
