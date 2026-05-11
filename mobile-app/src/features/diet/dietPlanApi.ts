/**
 * Diet Plan API - RTK Query
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { 
  DietPlan, 
  GenerateDietPlanRequest,
  ApiResponse 
} from '@app-types/api';

export const dietPlanApi = createApi({
  reducerPath: 'dietPlanApi',
  baseQuery,
  tagTypes: ['DietPlan'],
  endpoints: (builder) => ({
    generateDietPlan: builder.mutation<ApiResponse<DietPlan>, GenerateDietPlanRequest>({
      query: (data) => ({
        url: '/diet-plan/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DietPlan'],
    }),
    
    getDietPlans: builder.query<ApiResponse<DietPlan[]>, void>({
      query: () => '/diet-plan',
      providesTags: ['DietPlan'],
    }),
    
    getDietPlanById: builder.query<ApiResponse<DietPlan>, string>({
      query: (id) => `/diet-plan/${id}`,
      providesTags: (result, error, id) => [{ type: 'DietPlan', id }],
    }),
    
    deleteDietPlan: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/diet-plan/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DietPlan'],
    }),
    
    downloadDietPlanPDF: builder.mutation<Blob, string>({
      query: (id) => ({
        url: `/diet-plan/${id}/download`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGenerateDietPlanMutation,
  useGetDietPlansQuery,
  useGetDietPlanByIdQuery,
  useDeleteDietPlanMutation,
  useDownloadDietPlanPDFMutation,
} = dietPlanApi;
