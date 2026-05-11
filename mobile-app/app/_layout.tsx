/**
 * Root Layout
 * Provides global context and theme to the entire app
 */

import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { registerForPushNotificationsAsync } from '@services/notificationService';
import { OfflineIndicator } from '@components/common/OfflineIndicator';
import { initSentry } from '@services/sentry';
import ErrorBoundary from '@components/common/ErrorBoundary';

import { store, persistor } from '@store/index';
import { setNetworkStatus } from '@store/slices/offlineSlice';
import theme from '@theme/index';

initSentry();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const paperTheme = theme.light; // Always use light theme for now

  useEffect(() => {
    (async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          console.log('Expo Push Token:', pushToken);
        }
      } catch (e) {
        // Never let notifications crash app startup.
        console.warn('Push notification registration failed:', e);
      }
    })();
  }, []);

  useEffect(() => {
    // Setup network listener
    const unsubscribe = NetInfo.addEventListener((state) => {
      store.dispatch(setNetworkStatus(state));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <PaperProvider theme={paperTheme}>
              <OfflineIndicator />
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }} />
            </PaperProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
