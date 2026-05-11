import React, { useId } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// Refined SVG donut with smooth gradient stroke, crisp text, and subtle center cap
const ProgressDonut = ({ value = 0, size = 140, label = 'Progress', color = 'primary' }) => {
  const theme = useTheme();
  const gradId = useId();
  const normalized = Math.min(Math.max(value, 0), 100);

  // Stroke width ~10% of size, clamped 8-14
  const strokeWidth = Math.max(8, Math.min(14, Math.round(size * 0.10)));
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalized / 100) * circumference;

  // Typography sizes
  const percentFont = Math.max(18, Math.min(30, Math.round(size * 0.22)));
  const labelFont = Math.max(10, Math.min(12, Math.round(size * 0.08)));

  // Colors
  const start = theme.palette[color]?.main || theme.palette.primary.main;
  const end = theme.palette.secondary.main;
  const track = alpha(start, theme.palette.mode === 'dark' ? 0.18 : 0.12);
  const ringGlow = alpha(start, 0.18);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        position: 'relative',
        filter: `drop-shadow(0 4px 14px ${ringGlow})`,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
           style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={start} />
            <stop offset="100%" stopColor={end} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Center cap for readability */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth * 0.55}
          fill={alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.35 : 0.7)}
          stroke={alpha(start, 0.15)}
          strokeWidth={1}
        />
      </svg>

      {/* Center content */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography
          sx={{
            fontSize: `${percentFont}px`,
            fontWeight: 900,
            lineHeight: 1,
            color: theme.palette.text.primary,
            textShadow: theme.palette.mode === 'dark' ? `0 1px 0 ${alpha('#000', 0.3)}` : 'none',
            mb: 0.25,
          }}
          aria-label={`${normalized}%`}
        >
          {Math.round(normalized)}%
        </Typography>
        <Typography
          sx={{
            fontSize: `${labelFont}px`,
            color: theme.palette.text.secondary,
            fontWeight: 800,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressDonut;
