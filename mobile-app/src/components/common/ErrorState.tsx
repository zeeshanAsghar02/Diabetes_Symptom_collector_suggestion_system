/**
 * Modern Error State Component
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography, textStyles } from '@theme/typography';
import { spacing } from '@theme/spacing';
import { Button } from './Button';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={56}
          color={colors.error.main}
        />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error}</Text>
      <Button onPress={onRetry} style={styles.button}>
        Try Again
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: textStyles.h5.fontSize,
    fontWeight: textStyles.h5.fontWeight,
    lineHeight: textStyles.h5.lineHeight,
    color: colors.light.text.primary,
    marginBottom: spacing[2],
  },
  message: {
    fontSize: textStyles.body1.fontSize,
    fontWeight: textStyles.body1.fontWeight,
    lineHeight: textStyles.body1.lineHeight,
    color: colors.light.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {
    minWidth: 150,
  },
});
