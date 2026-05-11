/**
 * Feedback Feature - Redux Slice
 */
import { createSlice } from '@reduxjs/toolkit';

interface FeedbackState {}

const initialState: FeedbackState = {};

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {},
});

export const {} = feedbackSlice.actions;

export default feedbackSlice.reducer;
