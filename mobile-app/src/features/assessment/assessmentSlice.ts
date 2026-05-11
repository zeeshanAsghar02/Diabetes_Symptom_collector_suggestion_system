/**
 * Assessment Feature - Redux Slice
 */
import { createSlice } from '@reduxjs/toolkit';

interface AssessmentState {
  // This slice is currently managed by RTK Query,
  // but can be extended to hold other assessment-related state,
  // such as answers for an offline assessment.
}

const initialState: AssessmentState = {};

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {},
});

export const {} = assessmentSlice.actions;

export default assessmentSlice.reducer;
