/**
 * Modern Typography System
 * Production-grade type scale with proper hierarchy
 * System fonts for native feel + performance
 */

import { Platform } from 'react-native';

export const typography = {
  // Font Constamts - Using system fonts for native feel
  fontFamily: {
    // iOS: SF Pro, Android: Roboto
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semiBold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },
  
  // Modern Type Scale - Based on 16px base
  fontSize: {
    '2xs': 11,   // Fine print
    xs: 12,      // Caption, helper text
    sm: 14,      // Small body, secondary
    base: 16,    // Body text, primary
    lg: 18,      // Large body, subtitle
    xl: 20,      // H6
    '2xl': 24,   // H5
    '3xl': 28,   // H4
    '4xl': 32,   // H3
    '5xl': 36,   // H2
    '6xl': 40,   // H1
  },
  
  // Font Weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  
  // Line Heights - Responsive to font size
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

// Modern Text Styles - Preset configurations
export const textStyles = {
  h1: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['6xl'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['5xl'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.snug,
  },
  h4: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.snug,
  },
  h5: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.normal,
  },
  h6: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  },
  body1: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  body2: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.normal,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
};

export default typography;
