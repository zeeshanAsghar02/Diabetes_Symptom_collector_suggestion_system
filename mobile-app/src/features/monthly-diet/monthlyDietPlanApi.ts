/**
 * Monthly Diet Plan API - RTK Query
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { ApiResponse } from '@app-types/api';

// Types specific to monthly diet plan — field names match backend model
export interface MonthlyMealItem {
  food: string;
  portion: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
}

export interface MonthlyMealOption {
  _id?: string;
  option_name: string;
  items: MonthlyMealItem[];
  difficulty?: string;
  preparation_time?: string;
  description?: string;
  total_calories?: number;
}

export interface MonthlyMealCategory {
  meal_type: string;
  timing?: string;
  target_calories?: number;
  options: MonthlyMealOption[];
}

export interface MonthlyDietPlanData {
  _id: string;
  user_id: string;
  month: number;
  year: number;
  region?: string;
  total_daily_calories?: number;
  meal_categories: MonthlyMealCategory[];
  nutritional_guidelines?: {
    daily_carbs_range?: { min: number; max: number };
    daily_protein_range?: { min: number; max: number };
    daily_fat_range?: { min: number; max: number };
    daily_fiber_target?: number;
  };
  tips?: string[];
  status?: string;
  created_at: string;
  updated_at?: string;
}

export interface GenerationStatusResponse {
  status: 'pending' | 'complete' | 'failed' | 'not_found';
  planId?: string;
  month?: number;
  year?: number;
  generationTiming?: {
    startedAt?: string;
    elapsedMs?: number;
    estimatedDurationMs?: number;
    remainingMs?: number;
    progress?: number;
  };
  plan?: MonthlyDietPlanData;   // only present when status === 'complete'
  error?: string;               // only present when status === 'failed'
}

export interface GenerateMonthlyPlanRequest {
  month: number;
  year: number;
}

export interface SelectMealsRequest {
  planId: string;
  date: string;
  selections: {
    breakfast: string;
    mid_morning_snack: string;
    lunch: string;
    evening_snack: string;
    dinner: string;
  };
}

export const monthlyDietPlanApi = createApi({
  reducerPath: 'monthlyDietPlanApi',
  baseQuery,
  tagTypes: ['MonthlyDietPlan'],
  endpoints: (builder) => ({
    generateMonthlyDietPlan: builder.mutation<ApiResponse<MonthlyDietPlanData>, GenerateMonthlyPlanRequest>({
      query: (data) => ({
        url: '/monthly-diet-plan/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MonthlyDietPlan'],
    }),

    getCurrentMonthlyPlan: builder.query<ApiResponse<MonthlyDietPlanData>, void>({
      query: () => '/monthly-diet-plan/current',
      providesTags: ['MonthlyDietPlan'],
    }),

    getMonthlyPlanHistory: builder.query<ApiResponse<MonthlyDietPlanData[]>, { limit?: number }>({
      query: ({ limit = 12 } = {}) => ({
        url: '/monthly-diet-plan/history',
        params: { limit },
      }),
      providesTags: ['MonthlyDietPlan'],
    }),

    getMonthlyPlanById: builder.query<ApiResponse<MonthlyDietPlanData>, string>({
      query: (id) => `/monthly-diet-plan/${id}`,
      providesTags: (result, error, id) => [{ type: 'MonthlyDietPlan', id }],
    }),

    deleteMonthlyPlan: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/monthly-diet-plan/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MonthlyDietPlan'],
    }),

    selectMeals: builder.mutation<ApiResponse<MonthlyDietPlanData>, SelectMealsRequest>({
      query: ({ planId, ...body }) => ({
        url: `/monthly-diet-plan/${planId}/select`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MonthlyDietPlan'],
    }),

    /**
     * Poll the generation status of a monthly diet plan.
     * Returns { status: 'pending' | 'complete' | 'failed' | 'not_found', plan?, error? }
     */
    getGenerationStatus: builder.query<ApiResponse<GenerationStatusResponse>, { month: number; year: number }>({
      query: ({ month, year }) => `/monthly-diet-plan/status/${month}/${year}`,
      // No tag caching — this is intentionally a transient polling endpoint
    }),
  }),
});

export const {
  useGenerateMonthlyDietPlanMutation,
  useGetCurrentMonthlyPlanQuery,
  useGetMonthlyPlanHistoryQuery,
  useGetMonthlyPlanByIdQuery,
  useDeleteMonthlyPlanMutation,
  useSelectMealsMutation,
  useGetGenerationStatusQuery,
  useLazyGetGenerationStatusQuery,
} = monthlyDietPlanApi;
