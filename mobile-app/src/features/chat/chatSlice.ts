/**
 * Chat Feature - Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@app-types/api';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addMessage,
  setMessages,
  clearMessages,
  setLoading,
  setError,
} = chatSlice.actions;

export const selectChatMessages = (state: any) => state.chat.messages;
export const selectChatLoading = (state: any) => state.chat.loading;
export const selectChatError = (state: any) => state.chat.error;

export default chatSlice.reducer;
