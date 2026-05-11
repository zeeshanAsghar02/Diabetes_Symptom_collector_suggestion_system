/**
 * Diet Plan Feature - Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DietPlan } from '@app-types/api';

interface DietPlanState {
  currentPlan: DietPlan | null;
  plans: DietPlan[];
  loading: boolean;
  error: string | null;
}

const initialState: DietPlanState = {
  currentPlan: null,
  plans: [],
  loading: false,
  error: null,
};

const dietPlanSlice = createSlice({
  name: 'dietPlan',
  initialState,
  reducers: {
    setCurrentPlan: (state, action: PayloadAction<DietPlan>) => {
      state.currentPlan = action.payload;
    },
    setPlans: (state, action: PayloadAction<DietPlan[]>) => {
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
} = dietPlanSlice.actions;

export const selectCurrentDietPlan = (state: any) => state.dietPlan.currentPlan;
export const selectDietPlans = (state: any) => state.dietPlan.plans;
export const selectDietPlanLoading = (state: any) => state.dietPlan.loading;
export const selectDietPlanError = (state: any) => state.dietPlan.error;

export default dietPlanSlice.reducer;
