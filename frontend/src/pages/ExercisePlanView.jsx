import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Chip, Grid, Stack, Divider, Paper, 
  LinearProgress, Avatar, IconButton, Collapse, Badge, Tooltip, Button
} from '@mui/material';
import { useDateFormat } from '../hooks/useDateFormat';
import {
  FitnessCenter as FitnessCenterIcon,
  Timer as TimerIcon,
  LocalFireDepartment as CaloriesIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  WbSunny as MorningIcon,
  NightsStay as EveningIcon,
  WbTwilight as AfternoonIcon,
  Public as PublicIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Favorite as HeartIcon
} from '@mui/icons-material';

// Helper function to get intensity color
const getIntensityColor = (intensity) => {
  const intensityLower = (intensity || '').toLowerCase();
  if (intensityLower.includes('high') || intensityLower.includes('vigorous')) return '#f44336';
  if (intensityLower.includes('moderate')) return '#ff9800';
  return '#4caf50';
};

// Helper function to get time icon
const getTimeIcon = (time) => {
  const timeLower = (time || '').toLowerCase();
  if (timeLower.includes('morning')) return <MorningIcon sx={{ color: '#ffa726' }} />;
  if (timeLower.includes('afternoon')) return <AfternoonIcon sx={{ color: '#42a5f5' }} />;
  if (timeLower.includes('evening')) return <EveningIcon sx={{ color: '#7e57c2' }} />;
  return <TimerIcon />;
};

// Helper to get exercise emoji by category
const getExerciseEmoji = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('cardio') || cat.includes('aerobic')) return '🏃';
  if (cat.includes('strength') || cat.includes('resistance')) return '💪';
  if (cat.includes('flexibility') || cat.includes('stretch')) return '🧘';
  if (cat.includes('balance')) return '⚖️';
  if (cat.includes('yoga')) return '🧘‍♀️';
  if (cat.includes('walk')) return '🚶';
  if (cat.includes('swim')) return '🏊';
  if (cat.includes('cycle') || cat.includes('bike')) return '🚴';
  return '🏋️';
};

const ExercisePlanView = ({ plan }) => {
  const { formatDate } = useDateFormat();
  const [showDetails, setShowDetails] = useState(false);

  if (!plan) return null;

  const { region, totals, sessions, sources, tips, target_date } = plan;

  // Flatten all exercises from all sessions into one list
  const allExercises = [];
  sessions?.forEach((session, sessionIdx) => {
    session.items?.forEach((item, itemIdx) => {
      allExercises.push({
        ...item,
        sessionName: session.name,
        sessionTime: session.time,
        exerciseNumber: allExercises.length + 1
      });
    });
  });

  const summaryMetrics = [
    { label: 'Target Burn', value: `${Math.round(totals?.calories_total || 0)} kcal`, color: '#fb923c' },
    { label: 'Duration', value: `${totals?.duration_total_min || 0} mins`, color: '#67e8f9' },
    { label: 'Sessions', value: totals?.sessions_count || 0, color: '#34d399' },
    { label: 'Movements', value: allExercises.length, color: '#a78bfa' }
  ];

  return (
    <Box sx={{ bgcolor: '#0b0f19', color: '#f8fafc' }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={560} sx={{ mb: 0.6, color: '#fff', letterSpacing: '-0.045em' }}>
              Exercise Routine Details
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.62)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {formatDate(target_date)}
              </Typography>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#34d399', boxShadow: '0 0 14px rgba(52,211,153,0.65)' }} />
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 620, letterSpacing: '0.08em', textTransform: 'uppercase' }}>active</Typography>
              </Stack>
            </Stack>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#fff',
              bgcolor: 'rgba(17,24,39,0.76)',
              '&:hover': { borderColor: 'rgba(255,255,255,0.22)', bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={560} sx={{ color: '#fff', mb: 2, letterSpacing: '-0.025em' }}>
          Movement Summary
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, sm: 0 } }}>
          {summaryMetrics.map((metric, index) => (
            <Box key={metric.label} sx={{ px: { xs: 0, sm: 2 }, borderLeft: { xs: 0, sm: index === 0 ? 0 : '1px solid rgba(255,255,255,0.08)' } }}>
              <Typography variant="h4" fontWeight={360} sx={{ color: metric.color, mb: 0.5, fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', textShadow: `0 0 18px ${metric.color}2e` }}>
                {metric.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.72)', fontWeight: 650, fontSize: '0.7rem', letterSpacing: '0.11em', textTransform: 'uppercase' }}>
                {metric.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 560, mb: 2, letterSpacing: '-0.025em' }}>
          Workout Ledger
        </Typography>
        <Box sx={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 1.5, bgcolor: 'rgba(17,24,39,0.6)', overflow: 'hidden' }}>
          {allExercises.map((exercise, idx) => (
            <Box
              key={idx}
              sx={{
                px: { xs: 2, md: 2.5 },
                py: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '42px minmax(220px, 1.15fr) minmax(0, 1.7fr)' },
                gap: { xs: 1.2, md: 2 },
                alignItems: 'center',
                borderBottom: idx === allExercises.length - 1 ? 0 : '1px solid rgba(255,255,255,0.04)',
                transition: 'background-color 0.25s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' }
              }}
            >
              <Typography sx={{ color: 'rgba(148,163,184,0.5)', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', fontSize: 12 }}>
                {String(exercise.exerciseNumber).padStart(2, '0')}
              </Typography>
              <Box>
                <Typography variant="subtitle1" fontWeight={520} sx={{ color: '#fff', fontSize: '0.98rem' }}>
                  {exercise.exercise}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {exercise.sessionName} {exercise.sessionTime ? `• ${exercise.sessionTime}` : ''}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.62)', fontWeight: 520 }}>{exercise.category}</Typography>
                <Typography variant="caption" sx={{ color: '#67e8f9', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>{exercise.duration_min} min</Typography>
                <Typography variant="caption" sx={{ color: getIntensityColor(exercise.intensity), fontWeight: 520 }}>{exercise.intensity}</Typography>
                {exercise.estimated_calories && (
                  <Typography variant="caption" sx={{ color: '#34d399', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>{exercise.estimated_calories} kcal</Typography>
                )}
              </Stack>
              <Collapse in={showDetails} timeout="auto" sx={{ gridColumn: { xs: '1', md: '2 / -1' } }}>
                <Box sx={{ pt: 1.5, color: 'rgba(203,213,225,0.62)' }}>
                  {exercise.notes && <Typography variant="body2" sx={{ mb: 1 }}>{exercise.notes}</Typography>}
                  {exercise.heart_rate_zone && exercise.heart_rate_zone !== 'N/A' && <Typography variant="caption" sx={{ mr: 2 }}>Heart rate: {exercise.heart_rate_zone}</Typography>}
                  {exercise.mets && <Typography variant="caption">METs: {exercise.mets}</Typography>}
                  {exercise.precautions?.length > 0 && (
                    <Typography variant="body2" sx={{ color: '#fbbf24', mt: 1 }}>
                      Precautions: {exercise.precautions.join(', ')}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tips Section */}
      {tips?.length > 0 && (
        <Card elevation={0} sx={{ borderRadius: 1.5, border: 0, bgcolor: 'rgba(17,24,39,0.45)', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 560, mb: 2, letterSpacing: '-0.025em' }}>
              💡 Daily Tips
            </Typography>
            <Stack spacing={1.5}>
              {tips.map((tip, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'transparent',
                    borderBottom: i === tips.length - 1 ? 0 : '1px solid rgba(255,255,255,0.04)',
                    borderRadius: 0
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)', fontWeight: 430 }}>
                    {tip}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Sources Section (Collapsible) */}
      {showDetails && sources?.length > 0 && (
        <Card elevation={0} sx={{ borderRadius: 1.5, border: 0, bgcolor: 'rgba(17,24,39,0.45)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 560, mb: 2, letterSpacing: '-0.025em' }}>
              📚 Sources
            </Typography>
            <Stack spacing={1.5}>
              {sources.map((source, i) => (
                <Box 
                  key={i}
                  sx={{
                    p: 2,
                    borderRadius: 0,
                    bgcolor: 'transparent',
                    borderBottom: i === sources.length - 1 ? 0 : '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <Typography variant="body2" fontWeight={520} sx={{ color: '#fff', mb: 0.5 }}>
                    {source.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.55)' }}>
                    {source.country}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ExercisePlanView;
