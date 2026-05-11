// Premium Dashboard Theme Configuration
// Inspired by the landing page design system
import { alpha } from '@mui/material/styles';

export const colors = {
  // Primary palette - Professional blues
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  },
  
  // Secondary palette - Elegant purples
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
  },
  
  // Success palette - Fresh greens
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    gradient: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
  },
  
  // Warning palette - Warm oranges
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    gradient: 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)',
  },
  
  // Error palette - Bold reds
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    gradient: 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)',
  },
  
  // Info palette - Cool cyans
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    gradient: 'linear-gradient(135deg, #03a9f4 0%, #0288d1 100%)',
  },
  
  // Neutral palette
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background colors
  background: {
    default: '#ffffff',
    paper: '#ffffff',
    subtle: '#fafafa',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
};

export const cardStyles = {
  elevated: {
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    background: '#ffffff',
    border: `1px solid ${alpha(colors.primary.main, 0.08)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
    },
  },
  
  glass: {
    borderRadius: '20px',
    background: alpha('#ffffff', 0.85),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(colors.primary.main, 0.12)}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
  },
  
  gradient: (color1, color2) => ({
    borderRadius: '20px',
    background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
    boxShadow: `0 8px 32px ${alpha(color1, 0.25)}`,
    color: '#ffffff',
  }),
};

export const buttonStyles = {
  primary: {
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '10px 24px',
    background: colors.primary.gradient,
    color: '#ffffff',
    boxShadow: `0 4px 16px ${alpha(colors.primary.main, 0.25)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${alpha(colors.primary.main, 0.35)}`,
    },
  },
  
  secondary: {
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '10px 24px',
    background: 'transparent',
    color: colors.primary.main,
    border: `2px solid ${colors.primary.main}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      background: alpha(colors.primary.main, 0.08),
      transform: 'translateY(-2px)',
    },
  },
  
  ghost: {
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '10px 24px',
    background: 'transparent',
    color: colors.primary.main,
    '&:hover': {
      background: alpha(colors.primary.main, 0.08),
    },
  },
};

export const modalStyles = {
  backdrop: {
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  },
  
  container: {
    borderRadius: '24px',
    background: '#ffffff',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
  },
  
  header: (color) => ({
    background: `linear-gradient(135deg, ${color.main} 0%, ${color.dark} 100%)`,
    color: '#ffffff',
    padding: '24px 32px',
    borderBottom: 'none',
  }),
  
  content: {
    padding: '32px',
    overflowY: 'auto',
    background: colors.neutral[50],
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: colors.neutral[100],
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: colors.neutral[400],
      borderRadius: '4px',
      '&:hover': {
        background: colors.neutral[500],
      },
    },
  },
};

export const animationConfig = {
  transition: {
    duration: 0.3,
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
};

export const typography = {
  h1: {
    fontSize: '2.5rem',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
};

export default {
  colors,
  cardStyles,
  buttonStyles,
  modalStyles,
  animationConfig,
  typography,
};
