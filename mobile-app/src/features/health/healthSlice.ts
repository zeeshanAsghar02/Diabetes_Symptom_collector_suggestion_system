/**
 * Health Slice
 * Manages state related to health metrics.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HealthMetric, MetricType } from '@app-types/api';

interface HealthState {
  selectedMetric: MetricType | null;
}

const initialState: HealthState = {
  selectedMetric: null,
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    setSelectedMetric(state, action: PayloadAction<MetricType | null>) {
      state.selectedMetric = action.payload;
    },
  },
});

export const { setSelectedMetric } = healthSlice.actions;

export default healthSlice.reducer;
