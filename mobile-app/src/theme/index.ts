/**
 *Modern Theme System
 * Centralized design tokens for production-grade UI/UX
 */

import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, borderRadius, shadows, layout } from './spacing';

// Modern Light Theme (primary theme for diabetes app)
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[600],
    primaryContainer: colors.primary[100],
    onPrimary: colors.neutral[0],
    onPrimaryContainer: colors.primary[900],
    secondary: colors.neutral[600],
    secondaryContainer: colors.neutral[100],
    onSecondary: colors.neutral[0],
    onSecondaryContainer: colors.neutral[900],
    tertiary: colors.info.main,
    error: colors.error.main,
    errorContainer: colors.error.bg,
    background: colors.light.background.secondary,
    surface: colors.light.background.primary,
    surfaceVariant: colors.light.background.tertiary,
    onBackground: colors.light.text.primary,
    onSurface: colors.light.text.primary,
    outline: colors.light.border.main,
    outlineVariant: colors.light.border.light,
  },
  roundness: borderRadius.lg,
};

// Export all theme modules
export {
  colors,
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  layout,
};

// Common reusable styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.light.background.secondary,
  },
  contentPadding: {
    paddingHorizontal: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  divider: {
    height: 1,
    backgroundColor: colors.light.border.light,
    marginVertical: spacing[4],
  },
};

export type AppTheme = MD3Theme & {
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  layout: typeof layout;
};

export default {
  light: lightTheme,
  colors,
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  layout,
  commonStyles,
};
