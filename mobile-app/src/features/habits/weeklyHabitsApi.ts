/**
 * Weekly Habits API - RTK Query
 * AI-generated weekly habit tracking (separate from basic user habits in profileApi)
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { ApiResponse } from '@app-types/api';

export interface WeeklyHabit {
  id: string;
  category: 'diet' | 'exercise' | 'medication' | 'lifestyle' | 'sleep' | 'stress' | 'monitoring';
  title: string;
  description: string;
  targetValue?: number;
  unit?: string;
  frequency: string;
  timeOfDay?: string[];
  priority: 'high' | 'medium' | 'low';
  medicalReason?: string;
  tips?: string[];
}

export interface HabitProgressEntry {
  habitId: string;
  date: string;
  completed: boolean;
  actualValue?: number;
  notes?: string;
}

export interface WeeklyHabitsData {
  _id: string;
  user: string;
  habits: WeeklyHabit[];
  progress: HabitProgressEntry[];
  generationContext?: Record<string, unknown>;
  llmMetadata?: Record<string, unknown>;
  week_start?: string;
  week_end?: string;
  created_at: string;
}

export const weeklyHabitsApi = createApi({
  reducerPath: 'weeklyHabitsApi',
  baseQuery,
  tagTypes: ['WeeklyHabits'],
  endpoints: (builder) => ({
    generateWeeklyHabits: builder.mutation<ApiResponse<WeeklyHabitsData>, void>({
      query: () => ({
        url: '/habits/generate',
        method: 'POST',
      }),
      invalidatesTags: ['WeeklyHabits'],
    }),

    getCurrentWeeklyHabits: builder.query<
      ApiResponse<WeeklyHabitsData | null> & { completionRate?: number },
      void
    >({
      query: () => '/habits/current',
      providesTags: ['WeeklyHabits'],
    }),

    updateHabitProgress: builder.mutation<
      ApiResponse<WeeklyHabitsData> & { completionRate: number },
      { habitId: string; date: string; completed: boolean; actualValue?: number; notes?: string }
    >({
      query: (data) => ({
        url: '/habits/progress',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WeeklyHabits'],
    }),
  }),
});

export const {
  useGenerateWeeklyHabitsMutation,
  useGetCurrentWeeklyHabitsQuery,
  useUpdateHabitProgressMutation,
} = weeklyHabitsApi;
