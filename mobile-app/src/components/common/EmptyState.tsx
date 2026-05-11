/**
 * Modern Empty State Component
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography, textStyles } from '@theme/typography';
import { spacing } from '@theme/spacing';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
  onCtaPress?: () => void;
  ctaLabel?: string;
}

export function EmptyState({ icon, title, message, onCtaPress, ctaLabel }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={colors.neutral[300]}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onCtaPress && ctaLabel && (
        <Button onPress={onCtaPress} style={styles.button}>
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
    gap: spacing[4],
  },
  title: {
    fontSize: textStyles.h5.fontSize,
    fontWeight: textStyles.h5.fontWeight,
    lineHeight: textStyles.h5.lineHeight,
    color: colors.light.text.primary,
    textAlign: 'center',
  },
  message: {
    fontSize: textStyles.body1.fontSize,
    fontWeight: textStyles.body1.fontWeight,
    lineHeight: textStyles.body1.lineHeight,
    color: colors.light.text.secondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing[4],
  },
});
