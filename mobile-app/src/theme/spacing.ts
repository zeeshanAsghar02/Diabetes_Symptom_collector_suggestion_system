/**
 * Modern Spacing & Layout System
 * Strict 8pt grid - Professional, consistent spacing
 * Subtle elevation system
 */

// Strict 8pt Grid System (MANDATORY)
export const spacing = {
  0: 0,
  1: 4,    // 0.5 unit (rare use)
  2: 8,    // 1 unit - tight spacing
  3: 12,   // 1.5 units
  4: 16,   // 2 units - base spacing
  5: 20,   // 2.5 units
  6: 24,   // 3 units - section spacing
  8: 32,   // 4 units - large spacing
  10: 40,  // 5 units
  12: 48,  // 6 units - extra large
  16: 64,  // 8 units
  20: 80,  // 10 units
  24: 96,  // 12 units
};

// Modern Border Radius - Clean, contemporary
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

// Subtle Elevation System - NO heavy shadows
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
};

// Layout Constants
export const layout = {
  // Touch targets (WCAG AAA: 44x44 minimum)
  touchTarget: {
    min: 44,
    comfortable: 48,
    large: 56,
  },
  
  // Container padding
  container: {
    padding: 16,
    paddingLarge: 24,
  },
  
  // Screen edges
  screenPadding: {
    horizontal: 16,
    vertical: 24,
  },
};

export default spacing;
