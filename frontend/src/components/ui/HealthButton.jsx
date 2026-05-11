import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const variantMap = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined', color: 'primary' },
  tertiary: { variant: 'text', color: 'primary' },
  danger: { variant: 'contained', color: 'error' },
};

/**
 * Design-system button. Use `variant` (primary | secondary | tertiary | danger).
 * Alias: `tone` is accepted for the same values.
 */
export default function HealthButton({
  variant = 'primary',
  tone,
  loading = false,
  children,
  sx,
  disabled,
  ...props
}) {
  const key = tone || variant;
  const mapped = variantMap[key] || variantMap.primary;

  return (
    <Button
      {...mapped}
      {...props}
      disabled={disabled || loading}
      sx={{
        px: 3,
        py: 1.25,
        minHeight: 44,
        borderRadius: 3,
        fontWeight: 600,
        textTransform: 'none',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        ...sx,
      }}
    >
      {loading ? <CircularProgress size={18} color="inherit" aria-hidden /> : children}
    </Button>
  );
}
