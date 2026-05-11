/**
 * Exercise Plan Feature - Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ExercisePlan } from '@app-types/api';

interface ExercisePlanState {
  currentPlan: ExercisePlan | null;
  plans: ExercisePlan[];
  loading: boolean;
  error: string | null;
}

const initialState: ExercisePlanState = {
  currentPlan: null,
  plans: [],
  loading: false,
  error: null,
};

const exercisePlanSlice = createSlice({
  name: 'exercisePlan',
  initialState,
  reducers: {
    setCurrentPlan: (state, action: PayloadAction<ExercisePlan>) => {
      state.currentPlan = action.payload;
    },
    setPlans: (state, action: PayloadAction<ExercisePlan[]>) => {
      state.plans = action.payload;
    },
    clearCurrentPlan: (state) => {
      state.currentPlan = null;
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
  setCurrentPlan,
  setPlans,
  clearCurrentPlan,
  setLoading,
  setError,
} = exercisePlanSlice.actions;

export const selectCurrentExercisePlan = (state: any) => state.exercisePlan.currentPlan;
export const selectExercisePlans = (state: any) => state.exercisePlan.plans;
export const selectExercisePlanLoading = (state: any) => state.exercisePlan.loading;
export const selectExercisePlanError = (state: any) => state.exercisePlan.error;

export default exercisePlanSlice.reducer;
