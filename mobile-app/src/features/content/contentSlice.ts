/**
 * Content Feature - Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';

interface ContentState {
  // This slice is currently managed by RTK Query,
  // but can be extended to hold other content-related state.
}

const initialState: ContentState = {};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {},
});

export const {} = contentSlice.actions;

export default contentSlice.reducer;
