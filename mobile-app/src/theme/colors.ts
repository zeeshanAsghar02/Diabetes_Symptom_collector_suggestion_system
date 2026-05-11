/**
 * Modern Design System - Colors
 * Production-grade color palette (2026)
 * Clean, soft, professional
 */

export const colors = {
  // Primary Brand Colors - Modern indigo with excellent contrast
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',  // Main brand color
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  
  // Neutral Grays - Soft, modern gray scale
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  
  // Semantic Status Colors - Soft, professional
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    bg: '#D1FAE5',
    text: '#065F46',
  },
  
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    bg: '#FEF3C7',
    text: '#92400E',
  },
  
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    bg: '#FEE2E2',
    text: '#991B1B',
  },
  
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    bg: '#DBEAFE',
    text: '#1E40AF',
  },
  
  // Light Theme Tokens
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F5F5F5',
    },
    text: {
      primary: '#171717',
      secondary: '#525252',
      tertiary: '#A3A3A3',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#F5F5F5',
      main: '#E5E5E5',
      dark: '#D4D4D4',
    },
    shadow: 'rgba(0, 0, 0, 0.04)',
  },
  
  // Health-specific Colors (Diabetes context)
  health: {
    excellent: '#10B981',
    good: '#34D399',
    moderate: '#FBBF24',
    concerning: '#F59E0B',
    critical: '#EF4444',
  },
  
  // Chart/Data Visualization - Professional palette
  chart: {
    blue: '#3B82F6',
    green: '#10B981',
    amber: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    indigo: '#6366F1',
  },
};

export default colors;
