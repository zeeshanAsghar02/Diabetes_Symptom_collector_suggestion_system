/**
 * Modern Card Component
 * Production-grade with subtle elevation and clean design
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '@theme/colors';
import { spacing, borderRadius, shadows } from '@theme/spacing';

type CardVariant = 'elevated' | 'flat' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  testID?: string;
}

type CardCompoundComponent = React.FC<CardProps> & {
  Content: React.FC<{ children: React.ReactNode; style?: ViewStyle }>;
  Header: React.FC<{ children: React.ReactNode; style?: ViewStyle }>;
  Footer: React.FC<{ children: React.ReactNode; style?: ViewStyle }>;
};

const CardBase: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  style,
  padding = 4,
  testID,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding: spacing[padding] },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={cardStyle}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.light.background.primary,
  },
  elevated: {
    ...shadows.md,
  },
  flat: {
    backgroundColor: colors.light.background.secondary,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.light.border.main,
    backgroundColor: colors.light.background.primary,
  },
});

export const Card = Object.assign(CardBase, {
  Content: ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
    <View style={[{ padding: spacing[4] }, style]}>{children}</View>
  ),
  Header: ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
    <View style={[{ paddingBottom: spacing[3] }, style]}>{children}</View>
  ),
  Footer: ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
    <View style={[{ paddingTop: spacing[3] }, style]}>{children}</View>
  ),
}) as CardCompoundComponent;

export default Card;
