/**
 * Redux Store Configuration
 * Includes Redux Toolkit, RTK Query, and Redux Persist
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import type { PersistPartial } from 'redux-persist/es/persistReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Slices
import offlineReducer from './slices/offlineSlice';
import authReducer from '@features/auth/authSlice';
import dietPlanReducer from '@features/diet/dietPlanSlice';
import exercisePlanReducer from '@features/exercise/exercisePlanSlice';
import chatReducer from '@features/chat/chatSlice';
import profileReducer from '@features/profile/profileSlice';
import contentReducer from '@features/content/contentSlice';
import assessmentReducer from '@features/assessment/assessmentSlice';
import feedbackReducer from '@features/feedback/feedbackSlice';
import healthReducer from '@features/health/healthSlice';

// APIs
import { authApi } from '@features/auth/authApi';
import { dietPlanApi } from '@features/diet/dietPlanApi';
import { exercisePlanApi } from '@features/exercise/exercisePlanApi';
import { chatApi } from '@features/chat/chatApi';
import { profileApi } from '@features/profile/profileApi';
import { healthApi } from '@features/health/healthApi';
import { contentApi } from '@features/content/contentApi';
import { assessmentApi } from '@features/assessment/assessmentApi';
import { feedbackApi } from '@features/feedback/feedbackApi';
import { notificationApi } from '@features/notifications/notificationApi';
import { personalizedApi } from '@features/personalized/personalizedApi';
import { monthlyDietPlanApi } from '@features/monthly-diet/monthlyDietPlanApi';
import { lifestyleTipsApi } from '@features/lifestyle/lifestyleTipsApi';
import { weeklyHabitsApi } from '@features/habits/weeklyHabitsApi';

// Middleware
import offlineMiddleware from './syncMiddleware';

// Redux Persist Configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: [
    'offline',
    'auth',
    'dietPlan',
    'exercisePlan',
    'chat',
    'profile',
    'health',
  ],
  blacklist: [
    authApi.reducerPath,
    dietPlanApi.reducerPath,
    exercisePlanApi.reducerPath,
    chatApi.reducerPath,
    profileApi.reducerPath,
    contentApi.reducerPath,
    assessmentApi.reducerPath,
    feedbackApi.reducerPath,
    notificationApi.reducerPath,
    personalizedApi.reducerPath,
    monthlyDietPlanApi.reducerPath,
    lifestyleTipsApi.reducerPath,
    weeklyHabitsApi.reducerPath,
  ],
};

// Root Reducer
const rootReducer = combineReducers({
  auth: authReducer,
  offline: offlineReducer,
  dietPlan: dietPlanReducer,
  exercisePlan: exercisePlanReducer,
  chat: chatReducer,
  health: healthReducer,
  profile: profileReducer,
  content: contentReducer,
  assessment: assessmentReducer,
  feedback: feedbackReducer,
  [authApi.reducerPath]: authApi.reducer,
  [dietPlanApi.reducerPath]: dietPlanApi.reducer,
  [exercisePlanApi.reducerPath]: exercisePlanApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [healthApi.reducerPath]: healthApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [contentApi.reducerPath]: contentApi.reducer,
  [assessmentApi.reducerPath]: assessmentApi.reducer,
  [feedbackApi.reducerPath]: feedbackApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [personalizedApi.reducerPath]: personalizedApi.reducer,
  [monthlyDietPlanApi.reducerPath]: monthlyDietPlanApi.reducer,
  [lifestyleTipsApi.reducerPath]: lifestyleTipsApi.reducer,
  [weeklyHabitsApi.reducerPath]: weeklyHabitsApi.reducer,
});

// Types (based on the non-persisted reducer shape)
export type RootState = ReturnType<typeof rootReducer> & PersistPartial;

// Persisted Reducer
const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(persistConfig, rootReducer);

// Configure Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      dietPlanApi.middleware,
      exercisePlanApi.middleware,
      chatApi.middleware,
      healthApi.middleware,
      profileApi.middleware,
      contentApi.middleware,
      assessmentApi.middleware,
      feedbackApi.middleware,
      notificationApi.middleware,
      personalizedApi.middleware,
      monthlyDietPlanApi.middleware,
      lifestyleTipsApi.middleware,
      weeklyHabitsApi.middleware,
      offlineMiddleware
    ),
});

// Setup RTK Query listeners
setupListeners(store.dispatch);

// Persistor
export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;

export default store;
