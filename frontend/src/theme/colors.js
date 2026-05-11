/**
 * Centralized Color Palette for DiabetesCare Application
 * 
 * This file contains all colors used throughout the application.
 * Colors are organized by semantic meaning and usage.
 * 
 * Usage:
 * import { colors } from '../theme/colors';
 * sx={{ backgroundColor: colors.light.primary.main }}
 * 
 * Or use with theme:
 * theme.palette.primary.main (already configured in ThemeContext)
 */

export const colors = {
  // Light Theme Colors
  light: {
    // Primary Brand Colors (Blue tones)
    primary: {
      main: '#2563eb',      // Primary blue - main brand color
      light: '#60a5fa',     // Lighter blue - hover states, accents
      dark: '#1e40af',      // Darker blue - active states
      50: '#eff6ff',        // Lightest blue - backgrounds
      100: '#dbeafe',       // Very light blue
      200: '#bfdbfe',       // Light blue
      300: '#93c5fd',       // Medium light blue
      400: '#60a5fa',       // Medium blue
      500: '#3b82f6',       // Standard blue
      600: '#2563eb',       // Main brand blue
      700: '#1d4ed8',       // Dark blue
      800: '#1e40af',       // Darker blue
      900: '#1e3a8a',       // Darkest blue
      contrastText: '#ffffff',
    },

    // Secondary Colors (Slate/Gray tones)
    secondary: {
      main: '#64748b',      // Medium slate
      light: '#94a3b8',     // Light slate
      dark: '#475569',      // Dark slate
      50: '#f8fafc',        // Lightest slate - subtle backgrounds
      100: '#f1f5f9',       // Very light slate
      200: '#e2e8f0',       // Light slate
      300: '#cbd5e1',       // Medium light slate
      400: '#94a3b8',       // Medium slate
      500: '#64748b',       // Standard slate
      600: '#475569',       // Dark slate
      700: '#334155',       // Darker slate
      800: '#1e293b',       // Very dark slate
      900: '#0f172a',       // Darkest slate - almost black
      contrastText: '#ffffff',
    },

    // Success Colors (Green tones)
    success: {
      main: '#10b981',      // Main success green
      light: '#34d399',     // Light success green
      dark: '#059669',      // Dark success green
      50: '#ecfdf5',        // Lightest green
      100: '#d1fae5',       // Very light green
      200: '#a7f3d0',       // Light green
      300: '#6ee7b7',       // Medium light green
      400: '#34d399',       // Medium green
      500: '#10b981',       // Standard green
      600: '#059669',       // Dark green
      700: '#047857',       // Darker green
      800: '#065f46',       // Very dark green
      900: '#064e3b',       // Darkest green
      contrastText: '#ffffff',
    },

    // Warning Colors (Amber/Orange tones)
    warning: {
      main: '#f59e0b',      // Main warning orange
      light: '#fbbf24',     // Light warning orange
      dark: '#d97706',      // Dark warning orange
      50: '#fffbeb',        // Lightest amber
      100: '#fef3c7',       // Very light amber
      200: '#fde68a',       // Light amber
      300: '#fcd34d',       // Medium light amber
      400: '#fbbf24',       // Medium amber
      500: '#f59e0b',       // Standard amber
      600: '#d97706',       // Dark amber
      700: '#b45309',       // Darker amber
      800: '#92400e',       // Very dark amber
      900: '#78350f',       // Darkest amber
      contrastText: '#ffffff',
    },

    // Error Colors (Red tones)
    error: {
      main: '#ef4444',      // Main error red
      light: '#f87171',     // Light error red
      dark: '#dc2626',      // Dark error red
      50: '#fef2f2',        // Lightest red
      100: '#fee2e2',       // Very light red
      200: '#fecaca',       // Light red
      300: '#fca5a5',       // Medium light red
      400: '#f87171',       // Medium red
      500: '#ef4444',       // Standard red
      600: '#dc2626',       // Dark red
      700: '#b91c1c',       // Darker red
      800: '#991b1b',       // Very dark red
      900: '#7f1d1d',       // Darkest red
      contrastText: '#ffffff',
    },

    // Info Colors (Cyan/Blue tones)
    info: {
      main: '#0ea5e9',      // Main info blue
      light: '#38bdf8',     // Light info blue
      dark: '#0284c7',      // Dark info blue
      50: '#f0f9ff',        // Lightest cyan
      100: '#e0f2fe',       // Very light cyan
      200: '#bae6fd',       // Light cyan
      300: '#7dd3fc',       // Medium light cyan
      400: '#38bdf8',       // Medium cyan
      500: '#0ea5e9',       // Standard cyan
      600: '#0284c7',       // Dark cyan
      700: '#0369a1',       // Darker cyan
      800: '#075985',       // Very dark cyan
      900: '#0c4a6e',       // Darkest cyan
      contrastText: '#ffffff',
    },

    // Background Colors
    background: {
      default: '#f8fafc',   // Main page background (very light gray)
      paper: '#ffffff',     // Card/paper background (pure white)
      gradient: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', // Subtle gradient
      card: '#ffffff',      // Card backgrounds
      sidebar: '#ffffff',   // Sidebar background
      header: '#ffffff',    // Header background
      hover: '#f1f5f9',     // Hover state background
      selected: '#e0f2fe',  // Selected state background
      disabled: '#f8fafc',  // Disabled background
    },

    // Text Colors
    text: {
      primary: '#0f172a',   // Primary text (dark slate)
      secondary: '#475569', // Secondary text (medium slate)
      disabled: '#94a3b8',  // Disabled text (light slate)
      hint: '#64748b',      // Hint text (medium slate)
      inverse: '#ffffff',   // Inverse text (for dark backgrounds)
    },

    // Border & Divider Colors
    border: {
      main: '#e2e8f0',      // Main border color (light slate)
      light: '#f1f5f9',     // Light border
      dark: '#cbd5e1',      // Dark border
      focus: '#2563eb',     // Focus border (primary blue)
    },

    // Special UI Colors
    ui: {
      divider: '#e2e8f0',   // Divider lines
      overlay: 'rgba(0, 0, 0, 0.5)',      // Modal overlay
      shadow: 'rgba(0, 0, 0, 0.1)',       // Shadow color
      highlight: '#eff6ff', // Highlight backgrounds
      badge: '#dc2626',     // Badge/notification dot
    },
  },

  // Dark Theme Colors
  dark: {
    // Primary Brand Colors (Lighter blues for dark mode)
    primary: {
      main: '#60a5fa',      // Lighter blue for dark mode
      light: '#93c5fd',     // Even lighter blue
      dark: '#3b82f6',      // Slightly darker blue
      50: '#1e3a8a',        // Darkest blue
      100: '#1e40af',       // Very dark blue
      200: '#1d4ed8',       // Dark blue
      300: '#2563eb',       // Medium dark blue
      400: '#3b82f6',       // Medium blue
      500: '#60a5fa',       // Standard light blue
      600: '#93c5fd',       // Light blue
      700: '#bfdbfe',       // Lighter blue
      800: '#dbeafe',       // Very light blue
      900: '#eff6ff',       // Lightest blue
      contrastText: '#000000',
    },

    // Secondary Colors (Lighter slate/gray for dark mode)
    secondary: {
      main: '#94a3b8',      // Light slate for dark mode
      light: '#cbd5e1',     // Even lighter slate
      dark: '#64748b',      // Slightly darker slate
      50: '#0f172a',        // Darkest slate
      100: '#1e293b',       // Very dark slate
      200: '#334155',       // Dark slate
      300: '#475569',       // Medium dark slate
      400: '#64748b',       // Medium slate
      500: '#94a3b8',       // Standard light slate
      600: '#cbd5e1',       // Light slate
      700: '#e2e8f0',       // Lighter slate
      800: '#f1f5f9',       // Very light slate
      900: '#f8fafc',       // Lightest slate
      contrastText: '#000000',
    },

    // Success Colors (Lighter greens for dark mode)
    success: {
      main: '#34d399',      // Lighter green for visibility
      light: '#6ee7b7',     // Even lighter green
      dark: '#10b981',      // Slightly darker green
      50: '#064e3b',        // Darkest green
      100: '#065f46',       // Very dark green
      200: '#047857',       // Dark green
      300: '#059669',       // Medium dark green
      400: '#10b981',       // Medium green
      500: '#34d399',       // Standard light green
      600: '#6ee7b7',       // Light green
      700: '#a7f3d0',       // Lighter green
      800: '#d1fae5',       // Very light green
      900: '#ecfdf5',       // Lightest green
      contrastText: '#000000',
    },

    // Warning Colors (Lighter ambers for dark mode)
    warning: {
      main: '#fbbf24',      // Lighter amber for visibility
      light: '#fcd34d',     // Even lighter amber
      dark: '#f59e0b',      // Slightly darker amber
      50: '#78350f',        // Darkest amber
      100: '#92400e',       // Very dark amber
      200: '#b45309',       // Dark amber
      300: '#d97706',       // Medium dark amber
      400: '#f59e0b',       // Medium amber
      500: '#fbbf24',       // Standard light amber
      600: '#fcd34d',       // Light amber
      700: '#fde68a',       // Lighter amber
      800: '#fef3c7',       // Very light amber
      900: '#fffbeb',       // Lightest amber
      contrastText: '#000000',
    },

    // Error Colors (Lighter reds for dark mode)
    error: {
      main: '#f87171',      // Lighter red for visibility
      light: '#fca5a5',     // Even lighter red
      dark: '#ef4444',      // Slightly darker red
      50: '#7f1d1d',        // Darkest red
      100: '#991b1b',       // Very dark red
      200: '#b91c1c',       // Dark red
      300: '#dc2626',       // Medium dark red
      400: '#ef4444',       // Medium red
      500: '#f87171',       // Standard light red
      600: '#fca5a5',       // Light red
      700: '#fecaca',       // Lighter red
      800: '#fee2e2',       // Very light red
      900: '#fef2f2',       // Lightest red
      contrastText: '#000000',
    },

    // Info Colors (Lighter cyans for dark mode)
    info: {
      main: '#38bdf8',      // Lighter cyan for visibility
      light: '#7dd3fc',     // Even lighter cyan
      dark: '#0ea5e9',      // Slightly darker cyan
      50: '#0c4a6e',        // Darkest cyan
      100: '#075985',       // Very dark cyan
      200: '#0369a1',       // Dark cyan
      300: '#0284c7',       // Medium dark cyan
      400: '#0ea5e9',       // Medium cyan
      500: '#38bdf8',       // Standard light cyan
      600: '#7dd3fc',       // Light cyan
      700: '#bae6fd',       // Lighter cyan
      800: '#e0f2fe',       // Very light cyan
      900: '#f0f9ff',       // Lightest cyan
      contrastText: '#000000',
    },

    // Background Colors
    background: {
      default: '#0a0a0a',   // Main dark background (almost black)
      paper: '#1a1a1a',     // Card/paper background (dark gray)
      gradient: 'linear-gradient(180deg, #0f1729 0%, #0a0a0a 100%)', // Subtle dark gradient
      card: '#1e1e1e',      // Card backgrounds
      sidebar: '#1a1a1a',   // Sidebar background
      header: '#1a1a1a',    // Header background
      hover: '#252525',     // Hover state background
      selected: '#1e3a5f',  // Selected state background
      disabled: '#1a1a1a',  // Disabled background
    },

    // Text Colors
    text: {
      primary: '#ffffff',   // Primary text (white)
      secondary: '#a3a3a3', // Secondary text (light gray)
      disabled: '#666666',  // Disabled text (medium gray)
      hint: '#888888',      // Hint text (medium gray)
      inverse: '#0f172a',   // Inverse text (for light backgrounds)
    },

    // Border & Divider Colors
    border: {
      main: '#2d2d2d',      // Main border color (dark gray)
      light: '#1f1f1f',     // Light border
      dark: '#3d3d3d',      // Dark border
      focus: '#60a5fa',     // Focus border (primary blue)
    },

    // Special UI Colors
    ui: {
      divider: '#2d2d2d',   // Divider lines
      overlay: 'rgba(0, 0, 0, 0.8)',      // Modal overlay
      shadow: 'rgba(0, 0, 0, 0.5)',       // Shadow color
      highlight: '#1e3a5f', // Highlight backgrounds
      badge: '#ef4444',     // Badge/notification dot
    },
  },
};

/**
 * Helper function to get color value by path
 * @param {string} theme - 'light' or 'dark'
 * @param {string} path - dot notation path like 'primary.main' or 'background.paper'
 * @returns {string} color value
 */
export const getColor = (theme, path) => {
  const keys = path.split('.');
  let value = colors[theme];
  
  for (const key of keys) {
    value = value[key];
    if (!value) return undefined;
  }
  
  return value;
};

/**
 * Semantic color aliases for common use cases
 */
export const semanticColors = {
  // Status colors
  status: {
    success: colors.light.success.main,
    warning: colors.light.warning.main,
    error: colors.light.error.main,
    info: colors.light.info.main,
  },
  
  // Action colors
  action: {
    active: colors.light.primary.main,
    hover: colors.light.primary.light,
    selected: colors.light.primary[100],
    disabled: colors.light.secondary[300],
    disabledBackground: colors.light.secondary[100],
  },
};

export default colors;
