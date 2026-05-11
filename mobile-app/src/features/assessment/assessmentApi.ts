/**
 * Assessment Feature API - RTK Query
 * Handles disease/symptom/question tree and diabetes risk assessment
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { 
  Disease,
  Symptom,
  Question,
  AssessmentResult,
  SaveAnswersRequest,
  ApiResponse,
  DiseaseData,
} from '@app-types/api';

// Extended assessment result matching backend response
export interface DiabetesAssessmentResult {
  features: Record<string, number>;
  result: {
    risk_level: 'High' | 'Medium' | 'Low';
    diabetes_probability: number;
    confidence: number;
    total_symptoms?: number;
  };
  has_assessment: boolean;
  is_cached: boolean;
  assessment_date: string;
  notices?: string[];
  enhancement_status?: {
    enhanced: boolean;
    reason: string;
  };
  model_info?: {
    primary_model: string;
    enhancement_model: string;
    assessment_type: string;
  };
}

export const assessmentApi = createApi({
  reducerPath: 'assessmentApi',
  baseQuery,
  tagTypes: ['Diseases', 'Symptoms', 'Questions', 'Assessment'],
  endpoints: (builder) => ({
    // Public disease list
    getDiseases: builder.query<ApiResponse<Disease[]>, void>({
      query: () => '/diseases/public',
      providesTags: ['Diseases'],
    }),
    
    // Public symptoms for a disease
    getSymptomsByDisease: builder.query<ApiResponse<Symptom[]>, string>({
      query: (diseaseId) => `/symptoms/public/${diseaseId}`,
      providesTags: (result, error, diseaseId) => [{ type: 'Symptoms', id: diseaseId }],
    }),
    
    // Public questions for a symptom
    getQuestionsBySymptom: builder.query<ApiResponse<Question[]>, string>({
      query: (symptomId) => `/questions/public/symptom/${symptomId}`,
      providesTags: (result, error, symptomId) => [{ type: 'Questions', id: symptomId }],
    }),

    // Save an individual answer
    saveAnswer: builder.mutation<ApiResponse<{ answerId: string }>, { questionId: string; answerText: string }>({
      query: (data) => ({
        url: '/questions/answer',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Assessment'],
    }),

    // Batch save answers (for pending onboarding answers)
    batchSaveAnswers: builder.mutation<
      ApiResponse<{ savedCount: number; totalSubmitted: number; verifiedCount: number }>,
      { answers: Array<{ questionId: string; answerText: string }> }
    >({
      query: (data) => ({
        url: '/questions/batch-save-answers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Assessment'],
    }),

    // Complete onboarding
    completeOnboarding: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/questions/complete-onboarding',
        method: 'POST',
      }),
    }),

    // Run diabetes assessment
    runDiabetesAssessment: builder.mutation<ApiResponse<DiabetesAssessmentResult>, { force_new?: boolean }>({
      query: ({ force_new } = {}) => ({
        url: `/assessment/diabetes${force_new ? '?force_new=true' : ''}`,
        method: 'POST',
      }),
      invalidatesTags: ['Assessment'],
    }),

    // Get latest assessment
    getLatestAssessment: builder.query<ApiResponse<DiabetesAssessmentResult>, void>({
      query: () => '/assessment/diabetes/latest',
      providesTags: ['Assessment'],
    }),

    // Get assessment history
    getAssessmentHistory: builder.query<
      ApiResponse<{ assessments: DiabetesAssessmentResult[]; total: number }>,
      { limit?: number; skip?: number }
    >({
      query: ({ limit = 10, skip = 0 } = {}) => ({
        url: '/assessment/diabetes/history',
        params: { limit, skip },
      }),
      providesTags: ['Assessment'],
    }),

    // Get user's disease data (saved answers)
    // Backend returns a single DiseaseData object (or empty {}), not an array
    getUserDiseaseData: builder.query<ApiResponse<DiseaseData>, void>({
      query: () => '/users/my-disease-data',
      providesTags: ['Assessment'],
    }),

    // Legacy endpoints for backward compatibility
    saveAnswers: builder.mutation<ApiResponse<AssessmentResult>, SaveAnswersRequest>({
      query: (data) => ({
        url: '/assessment/save-answers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Assessment'],
    }),
    
    runAssessment: builder.mutation<ApiResponse<AssessmentResult>, { age: number; gender: string }>({
      query: (data) => ({
        url: '/assessment/run',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Assessment'],
    }),
  }),
});

export const {
  useGetDiseasesQuery,
  useGetSymptomsByDiseaseQuery,
  useGetQuestionsBySymptomQuery,
  useSaveAnswerMutation,
  useBatchSaveAnswersMutation,
  useCompleteOnboardingMutation,
  useRunDiabetesAssessmentMutation,
  useGetLatestAssessmentQuery,
  useGetAssessmentHistoryQuery,
  useGetUserDiseaseDataQuery,
  useSaveAnswersMutation,
  useRunAssessmentMutation,
} = assessmentApi;
