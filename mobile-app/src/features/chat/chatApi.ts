/**
 * Chat API - RTK Query
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@services/api';
import type { 
  ChatMessage,
  SendMessageRequest,
  ApiResponse 
} from '@app-types/api';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery,
  tagTypes: ['Chat'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ApiResponse<ChatMessage>, SendMessageRequest>({
      query: (data) => ({
        url: '/chat/send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
    }),
    
    getChatHistory: builder.query<ApiResponse<ChatMessage[]>, void>({
      query: () => '/chat/history',
      providesTags: ['Chat'],
    }),
    
    clearChatHistory: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/chat/clear',
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useGetChatHistoryQuery,
  useClearChatHistoryMutation,
} = chatApi;
