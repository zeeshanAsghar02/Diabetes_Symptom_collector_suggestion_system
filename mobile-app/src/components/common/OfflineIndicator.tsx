/**
 * Offline Indicator Banner
 *
 * A simple banner that appears at the top of the screen when the
 * application is offline.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineIndicator = () => {
  const netInfo = useNetInfo();
  const isConnected = Boolean(netInfo.isConnected);
  const { top } = useSafeAreaInsets();

  if (isConnected) {
    return null;
  }

  return (
    <Banner
      visible={!isConnected}
      style={[styles.banner, { top }]}
      icon="wifi-off"
    >
      You are currently offline. Some features may be unavailable.
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
