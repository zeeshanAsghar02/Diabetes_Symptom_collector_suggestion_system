/**
 * Modern Full Screen Loader Component
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, Text } from 'react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing, borderRadius } from '@theme/spacing';

interface FullScreenLoaderProps {
  message?: string;
}

export function FullScreenLoader({ message = 'Loading...' }: FullScreenLoaderProps) {
  return (
    <Modal transparent={true} animationType="fade" visible={true}>
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: colors.light.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[4],
    minWidth: 160,
  },
  message: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.light.text.secondary,
  },
});
