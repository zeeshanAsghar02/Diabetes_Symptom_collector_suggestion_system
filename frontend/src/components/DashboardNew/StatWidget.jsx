import React from 'react';
import { Box, Typography, Paper, alpha } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const StatWidget = ({ title, value, caption, icon, color = 'primary', onClick }) => {
  const getMainColor = (t) => t.palette[color]?.main || t.palette.primary.main;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 2.5,
        borderRadius: 3,
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
        transition: 'all 0.2s ease',
        '&:hover': onClick ? {
          borderColor: (t) => getMainColor(t),
          boxShadow: (t) => `0 4px 12px ${alpha(getMainColor(t), 0.12)}`,
        } : {},
      }}
    >
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography
            variant="overline"
            sx={{
              color: (t) => t.palette.text.secondary,
              letterSpacing: 1.2,
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          >
            {title}
          </Typography>
          <Box sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: (t) => getMainColor(t),
            background: (t) => alpha(getMainColor(t), 0.1),
            border: (t) => `1px solid ${alpha(getMainColor(t), 0.2)}`,
          }}>
            {icon || <TrendingUpIcon fontSize="small" />}
          </Box>
        </Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.2 }}>
          {value}
        </Typography>
        {caption && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {caption}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default StatWidget;
