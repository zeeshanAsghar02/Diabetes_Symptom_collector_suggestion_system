import React from 'react';
import { Box, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * GlassCard: premium glassmorphism + gradient border card
 * - Uses background-clip trick to render a gradient border cleanly
 * - Subtle ambient shadow and hover lift
 */
const GlassCard = ({
  children,
  sx = {},
  hover = true,
  radius = 18,
  gradient = (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.6)}, ${alpha(t.palette.secondary.main, 0.6)})`,
  background = (t) => (t.palette.mode === 'dark' ? alpha(t.palette.background.paper, 0.75) : alpha('#ffffff', 0.7)),
  padding = 24,
  as = Paper,
  ...rest
}) => {
  const Component = as;
  return (
    <Component
      elevation={0}
      sx={{
        position: 'relative',
        p: padding,
        borderRadius: radius,
        border: '1px solid transparent',
        backgroundImage: (t) => `${background(t)}, ${gradient(t)}`,
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: (t) => `0 10px 30px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.45 : 0.08)}`,
        transition: 'transform .2s ease, box-shadow .2s ease',
        ...(hover && {
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: (t) => `0 16px 40px ${alpha(t.palette.primary.main, 0.25)}`,
          },
        }),
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default GlassCard;
