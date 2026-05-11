/**
 * Content Feature API - RTK Query
 * For lifestyle tips, articles, testimonials
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { 
  LifestyleTip,
  Content,
  Testimonial,
  Category,
  ApiResponse 
} from '@app-types/api';

export const contentApi = createApi({
  reducerPath: 'contentApi',
  baseQuery,
  tagTypes: ['LifestyleTips', 'Content', 'Testimonials', 'Categories'],
  endpoints: (builder) => ({
    getContentCategories: builder.query<ApiResponse<Category[]>, void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    getLifestyleTips: builder.query<ApiResponse<LifestyleTip[]>, { category?: string }>({
      query: (params) => ({
        url: '/lifestyle-tips',
        params,
      }),
      providesTags: ['LifestyleTips'],
    }),
    
    getLifestyleTipById: builder.query<ApiResponse<LifestyleTip>, string>({
      query: (id) => `/lifestyle-tips/${id}`,
      providesTags: (result, error, id) => [{ type: 'LifestyleTips', id }],
    }),
    
    getContent: builder.query<ApiResponse<Content[]>, { type?: string; tags?: string[] }>({
      query: (params) => ({
        url: '/content',
        params,
      }),
      providesTags: ['Content'],
    }),

    getAllArticles: builder.query<ApiResponse<Content[]>, { category?: string; limit?: number }>({
      query: (params) => ({
        url: '/content',
        params: { limit: params?.limit ?? 50, ...params },
      }),
      providesTags: ['Content'],
    }),

    getContentByCategory: builder.query<ApiResponse<Content[]>, string>({
      query: (categorySlug) => ({
        url: '/content',
        params: { category: categorySlug },
      }),
      providesTags: ['Content'],
    }),
    
    getContentById: builder.query<ApiResponse<Content>, string>({
      query: (id) => `/content/${id}`,
      providesTags: (result, error, id) => [{ type: 'Content', id }],
    }),
    
    getTestimonials: builder.query<ApiResponse<Testimonial[]>, void>({
      query: () => '/testimonials',
      providesTags: ['Testimonials'],
    }),
  }),
});

export const {
  useGetContentCategoriesQuery,
  useGetLifestyleTipsQuery,
  useGetLifestyleTipByIdQuery,
  useGetContentQuery,
  useGetAllArticlesQuery,
  useGetContentByCategoryQuery,
  useGetContentByIdQuery,
  useGetTestimonialsQuery,
} = contentApi;
