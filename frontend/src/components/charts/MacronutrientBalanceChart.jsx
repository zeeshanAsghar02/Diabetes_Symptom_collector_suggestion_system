import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';

export default function MacronutrientBalanceChart({ balanceData }) {
  const macros = [
    { name: 'Carbohydrates', key: 'carbs', value: balanceData.carbs, color: '#f97316' },
    { name: 'Proteins', key: 'protein', value: balanceData.protein, color: '#3b82f6' },
    { name: 'Fats', key: 'fat', value: balanceData.fat, color: '#eab308' },
    { name: 'Fiber', key: 'fiber', value: balanceData.fiber, color: '#10b981' },
  ];

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      {macros.map((macro) => (
        <Box key={macro.key}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ fontSize: '0.95rem', fontWeight: 500 }}
            >
              {macro.name}
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
              {macro.value}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={macro.value} 
            sx={{ 
              height: 14, 
              borderRadius: 2, 
              bgcolor: alpha(macro.color, 0.12), 
              '& .MuiLinearProgress-bar': { 
                bgcolor: macro.color, 
                borderRadius: 2, 
                transition: 'transform 0.4s ease' 
              } 
            }} 
          />
        </Box>
      ))}
    </Box>
  );
}
