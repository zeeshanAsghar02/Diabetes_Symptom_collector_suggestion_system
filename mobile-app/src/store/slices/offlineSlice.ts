/**
 * Offline Slice
 * Manages network connectivity and offline queue
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface OfflineState {
  isConnected: boolean;
  isInternetReachable: boolean;
  lastSync: string | null;
  pendingActions: QueuedAction[];
}

interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

const initialState: OfflineState = {
  isConnected: true,
  isInternetReachable: true,
  lastSync: null,
  pendingActions: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setNetworkStatus: (state, action: PayloadAction<NetInfoState>) => {
      state.isConnected = action.payload.isConnected ?? false;
      state.isInternetReachable = action.payload.isInternetReachable ?? false;
    },
    
    queueAction: (state, action: PayloadAction<Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>>) => {
      const queuedAction: QueuedAction = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };
      state.pendingActions.push(queuedAction);
    },
    
    removeAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(
        (a) => a.id !== action.payload
      );
    },
    
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const actionIndex = state.pendingActions.findIndex(
        (a) => a.id === action.payload
      );
      if (actionIndex !== -1) {
        state.pendingActions[actionIndex].retryCount += 1;
      }
    },
    
    clearQueue: (state) => {
      state.pendingActions = [];
    },
    
    updateLastSync: (state) => {
      state.lastSync = new Date().toISOString();
    },
  },
});

export const {
  setNetworkStatus,
  queueAction,
  removeAction,
  incrementRetryCount,
  clearQueue,
  updateLastSync,
} = offlineSlice.actions;

export default offlineSlice.reducer;

// Selectors
export const selectIsOnline = (state: { offline: OfflineState }) => 
  state.offline.isConnected && state.offline.isInternetReachable;

export const selectPendingActionsCount = (state: { offline: OfflineState }) =>
  state.offline.pendingActions.length;

export const selectLastSync = (state: { offline: OfflineState }) =>
  state.offline.lastSync;

export const selectPendingActions = (state: { offline: OfflineState }) =>
  state.offline.pendingActions;
