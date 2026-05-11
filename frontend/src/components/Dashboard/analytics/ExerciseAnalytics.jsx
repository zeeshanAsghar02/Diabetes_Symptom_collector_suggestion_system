import React, { useState } from 'react';
import { Box, Grid, Paper, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { alpha } from '@mui/material/styles';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function ExerciseAnalytics({ planUsageAnalytics }) {
  const [exerciseTimeRange, setExerciseTimeRange] = useState('weekly');

  return (
    <Grid item xs={12} lg={6}>
      {/* Section Header */}
      <Box sx={{ 
        mb: 4, 
        pb: 2, 
        borderBottom: (t) => `3px solid ${alpha('#3b82f6', 0.15)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 56, 
          height: 56, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)'
        }}>
          <FitnessCenterIcon sx={{ color: '#fff', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ 
            color: 'text.primary', 
            letterSpacing: -0.5, 
            fontSize: { xs: '1.5rem', md: '1.875rem' },
            mb: 0.5
          }}>
            Exercise & Activity Analytics
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            Monitor your physical activity and exercise patterns
          </Typography>
        </Box>
      </Box>

      {/* Exercise Duration Tracking */}
      <Paper elevation={0} sx={{ 
        p: { xs: 3, md: 3.5 }, 
        borderRadius: 4, 
        border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
        background: (t) => t.palette.background.paper,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        mb: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        '&:hover': { 
          transform: 'translateY(-6px)', 
          boxShadow: '0 12px 28px rgba(59, 130, 246, 0.15)',
          borderColor: (t) => alpha('#3b82f6', 0.3)
        } 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>Exercise Duration</Typography>
          <ToggleButtonGroup
            value={exerciseTimeRange}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setExerciseTimeRange(newValue);
              }
            }}
            size="small"
            sx={{ height: 32 }}
          >
            <ToggleButton value="daily" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>Daily</ToggleButton>
            <ToggleButton value="weekly" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>Weekly</ToggleButton>
            <ToggleButton value="monthly" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={Array.isArray(planUsageAnalytics?.dailySeries) ? planUsageAnalytics.dailySeries.slice(exerciseTimeRange === 'daily' ? -7 : exerciseTimeRange === 'weekly' ? -14 : -30) : []}>
            <defs>
              <linearGradient id="colorExercise" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="exerciseMinutes" stroke="#3b82f6" fill="url(#colorExercise)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon fontSize="small" color="info" />
          <Typography variant="caption" color="text.secondary">
            Avg: {planUsageAnalytics?.dailySeries?.length > 0 ? Math.round(planUsageAnalytics.dailySeries.slice(exerciseTimeRange === 'daily' ? -7 : exerciseTimeRange === 'weekly' ? -14 : -30).reduce((sum, d) => sum + (d.exerciseMinutes || 0), 0) / planUsageAnalytics.dailySeries.slice(exerciseTimeRange === 'daily' ? -7 : exerciseTimeRange === 'weekly' ? -14 : -30).length) : 0} min/day
          </Typography>
        </Box>
      </Paper>
    </Grid>
  );
}
