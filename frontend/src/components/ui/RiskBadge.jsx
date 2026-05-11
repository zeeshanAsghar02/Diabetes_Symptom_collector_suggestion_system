import React from 'react';
import { Chip } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const normalizeLevel = (level = '') => String(level).toLowerCase().trim();

const getRiskTone = (level) => {
  const normalized = normalizeLevel(level);
  if (['critical', 'high'].includes(normalized)) return 'critical';
  if (['concerning'].includes(normalized)) return 'concerning';
  if (['moderate', 'medium'].includes(normalized)) return 'moderate';
  if (['good', 'low'].includes(normalized)) return 'good';
  return 'excellent';
};

const getIcon = (tone) => {
  if (tone === 'critical' || tone === 'concerning') return <ErrorOutlineIcon fontSize="small" />;
  if (tone === 'moderate') return <WarningAmberIcon fontSize="small" />;
  return <CheckCircleOutlineIcon fontSize="small" />;
};

export default function RiskBadge({ level = 'Unknown', label, sx, ...props }) {
  const tone = getRiskTone(level);
  const chipLabel = label ?? `Risk: ${level}`;

  return (
    <Chip
      {...props}
      icon={getIcon(tone)}
      label={chipLabel}
      sx={{
        fontWeight: 700,
        borderRadius: 999,
        color: (theme) => theme.palette.health[tone],
        backgroundColor: (theme) => `${theme.palette.health[tone]}1A`,
        border: (theme) => `1px solid ${theme.palette.health[tone]}66`,
        ...sx,
      }}
    />
  );
}
