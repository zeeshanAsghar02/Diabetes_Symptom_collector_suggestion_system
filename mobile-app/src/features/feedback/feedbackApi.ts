/**
 * Feedback API - RTK Query
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { Feedback, CreateFeedbackRequest, ApiResponse } from '@app-types/api';

type MyFeedbackResponse = ApiResponse<{ feedback: Feedback[] }>;

const toFeedbackPayload = (input: CreateFeedbackRequest) => {
  const { category, rating, comment, is_anonymous, category_ratings } = input;

  const mergedCategoryRatings = {
    ...(category_ratings ?? undefined),
    ...(category ? { [category]: rating } : undefined),
  } as Record<string, number> | undefined;

  return {
    rating,
    comment,
    is_anonymous,
    category_ratings:
      mergedCategoryRatings && Object.keys(mergedCategoryRatings).length > 0
        ? mergedCategoryRatings
        : undefined,
  };
};

export const feedbackApi = createApi({
  reducerPath: 'feedbackApi',
  baseQuery,
  tagTypes: ['Feedback'],
  endpoints: (builder) => ({
    submitFeedback: builder.mutation<ApiResponse<{ feedback: Feedback }>, CreateFeedbackRequest>({
      query: (data) => ({
        url: '/feedback',
        method: 'POST',
        body: toFeedbackPayload(data),
      }),
      invalidatesTags: ['Feedback'],
    }),

    getMyFeedback: builder.query<MyFeedbackResponse, void>({
      query: () => '/feedback/my-feedback',
      providesTags: ['Feedback'],
    }),

    updateFeedback: builder.mutation<
      ApiResponse<{ feedback: Feedback }>,
      { id: string; feedback: CreateFeedbackRequest }
    >({
      query: ({ id, feedback }) => ({
        url: `/feedback/${id}`,
        method: 'PUT',
        body: toFeedbackPayload(feedback),
      }),
      invalidatesTags: ['Feedback'],
    }),

    deleteFeedback: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/feedback/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Feedback'],
    }),
  }),
});

export const {
  useSubmitFeedbackMutation,
  useGetMyFeedbackQuery,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
} = feedbackApi;
