/**
 * Profile Feature - Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { profileApi } from './profileApi';
import type { Profile } from '@app-types/api';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(profileApi.endpoints.getProfile.matchFulfilled, (state, { payload }) => {
        if (payload.success) {
          state.profile = payload.data;
        }
      })
      .addMatcher(profileApi.endpoints.updateProfile.matchFulfilled, (state, { payload }) => {
        if (payload.success) {
          state.profile = payload.data;
        }
      });
  },
});

export const { setProfile, clearProfile } = profileSlice.actions;

export const selectUserProfile = (state: { profile: ProfileState }) => state.profile.profile;

export default profileSlice.reducer;
