/**
 * Sync Middleware
 * Handles offline queue and background sync
 */

import type { Middleware } from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';
import {
  queueAction,
  removeAction,
  incrementRetryCount,
  updateLastSync,
  selectIsOnline,
  selectPendingActions,
} from './slices/offlineSlice';
import apiClient from '@services/api';
import { createAction } from '@reduxjs/toolkit';

// Track API mutations that should be queued when offline
const QUEUEABLE_ACTIONS = [
  'diet/generatePlan',
  'exercise/generatePlan',
  'lifestyle/generateTips',
  'feedback/submit',
  'profile/update',
  'assessment/run',
];

const isQueueableAction = (type: string): boolean => {
  return QUEUEABLE_ACTIONS.some((pattern) => type.includes(pattern));
};

/**
 * Middleware to queue mutations when offline
 */
export const offlineMiddleware: Middleware = (store) => (next) => (action) => {
  const state = store.getState();
  const isOnline = selectIsOnline(state);

  const typedAction = action as { type?: string; payload?: unknown };

  // Check if action should be queued when offline
  if (!isOnline && typedAction.type && isQueueableAction(typedAction.type)) {
    // Queue the action instead of executing
    store.dispatch(
      queueAction({
        type: typedAction.type,
        payload: typedAction.payload,
      })
    );
    
    // Return a pending promise to maintain RTK Query behavior
    return Promise.resolve({ data: null, meta: { queued: true } });
  }

  return next(action);
};

/**
 * Process queued actions when back online
 */
export const processQueuedActions = async (dispatch: any, getState: any) => {
  const state = getState();
  const isOnline = selectIsOnline(state);
  
  if (!isOnline) {
    console.log('[Sync] Cannot process queue - device is offline');
    return;
  }

  const pendingActions = selectPendingActions(state);
  
  if (pendingActions.length === 0) {
    console.log('[Sync] No pending actions to process');
    return;
  }

  console.log(`[Sync] Processing ${pendingActions.length} queued actions...`);

  for (const queuedAction of pendingActions) {
    try {
      // Attempt to execute the action
      await executeQueuedAction(queuedAction);
      
      // Remove from queue on success
      dispatch(removeAction(queuedAction.id));
      console.log(`[Sync] Successfully processed action: ${queuedAction.type}`);
    } catch (error: any) {
      console.error(`[Sync] Failed to process action: ${queuedAction.type}`, error);
      
      // Increment retry count
      dispatch(incrementRetryCount(queuedAction.id));
      
      // Remove if exceeded max retries
      if (queuedAction.retryCount >= 3) {
        dispatch(removeAction(queuedAction.id));
        console.log(`[Sync] Removed action after max retries: ${queuedAction.type}`);
      }
    }
  }

  // Update last sync timestamp
  dispatch(updateLastSync());
  console.log('[Sync] Queue processing complete');
};

/**
 * Execute a queued action
 */
const executeQueuedAction = async (action: any): Promise<void> => {
  // Map action type to API endpoint
  const endpoint = getEndpointForAction(action.type);
  
  if (!endpoint) {
    throw new Error(`No endpoint mapping for action: ${action.type}`);
  }

  await apiClient.post(endpoint, action.payload);
};

/**
 * Map action type to API endpoint
 */
const getEndpointForAction = (type: string): string | null => {
  if (type.includes('diet/generatePlan')) return '/diet-plan/generate';
  if (type.includes('exercise/generatePlan')) return '/exercise-plan/auto-generate';
  if (type.includes('lifestyle/generateTips')) return '/lifestyle-tips/auto-generate';
  if (type.includes('feedback/submit')) return '/feedback';
  if (type.includes('profile/update')) return '/users/profile';
  if (type.includes('assessment/run')) return '/assessment/diabetes';
  
  return null;
};

/**
 * Setup network listener
 */
export const setupNetworkListener = (dispatch: any, getState: any) => {
  return NetInfo.addEventListener((state) => {
    const previousState = getState();
    const wasOnline = selectIsOnline(previousState);
    const isNowOnline = Boolean(state.isConnected && state.isInternetReachable);

    // Dispatch network status update
    dispatch({ type: 'offline/setNetworkStatus', payload: state });

    // Process queue if just came back online
    if (!wasOnline && isNowOnline) {
      console.log('[Sync] Device came back online, processing queue...');
      processQueuedActions(dispatch, getState);
    }
  });
};

export const triggerSync = createAction('offline/triggerSync');

export default offlineMiddleware;
