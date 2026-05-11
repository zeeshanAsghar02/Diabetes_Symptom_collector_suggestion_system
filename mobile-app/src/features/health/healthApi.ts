/**
 * Health API - RTK Query
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { HealthMetric, HealthSummary, ApiResponse } from '@app-types/api';

export const healthApi = createApi({
  reducerPath: 'healthApi',
  baseQuery,
  tagTypes: ['Health'],
  endpoints: (builder) => ({
    getHealthSummary: builder.query<ApiResponse<HealthSummary>, void>({
      query: () => '/health/summary',
      providesTags: ['Health'],
    }),

    getHealthHistory: builder.query<ApiResponse<HealthMetric[]>, string>({
      query: (metricType) => `/health/history/${metricType}`,
      providesTags: (result, error, metricType) => [{ type: 'Health', id: metricType }],
    }),

    logHealthMetric: builder.mutation<ApiResponse<HealthMetric>, Partial<HealthMetric>>({
      query: (body) => ({
        url: '/health/log',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Health'],
    }),
  }),
});

export const {
  useGetHealthSummaryQuery,
  useGetHealthHistoryQuery,
  useLogHealthMetricMutation,
} = healthApi;
