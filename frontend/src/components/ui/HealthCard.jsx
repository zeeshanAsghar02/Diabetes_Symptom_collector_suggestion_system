import React from 'react';
import { Card, CardContent } from '@mui/material';

/**
 * @param {boolean} content — wrap children in CardContent (default true)
 * @param {'default'|'elevated'} variant — shadow emphasis
 * @param {boolean} interactive — hover lift for clickable cards
 */
export default function HealthCard({
  children,
  content = true,
  interactive = false,
  variant = 'default',
  sx,
  contentSx,
  ...props
}) {
  return (
    <Card
      {...props}
      elevation={0}
      sx={{
        borderRadius: 4,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: (theme) =>
          variant === 'elevated' ? theme.shadows[4] : theme.palette.shadow,
        backgroundColor: (theme) => theme.palette.background.paper,
        transition: 'box-shadow 200ms ease, transform 200ms ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
        ...(interactive && {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (theme) => theme.shadows[6],
          },
        }),
        ...sx,
      }}
    >
      {content ? (
        <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } }, ...contentSx }}>
          {children}
        </CardContent>
      ) : (
        children
      )}
    </Card>
  );
}
