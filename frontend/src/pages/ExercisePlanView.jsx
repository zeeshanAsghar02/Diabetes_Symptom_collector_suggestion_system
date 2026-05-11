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

  return (
    <Box>
      {/* Clean Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0'
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: '#1e293b' }}>
              Today's Exercise Plan
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip 
                label={formatDate(target_date)} 
                size="small"
                sx={{ bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 500 }} 
              />
              <Chip 
                label={region} 
                size="small"
                sx={{ bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 500 }} 
              />
              <Chip 
                label={`${totals?.sessions_count || 0} Sessions`} 
                size="small"
                sx={{ bgcolor: '#f0f4ff', color: '#667eea', border: '1px solid #e2e8f0', fontWeight: 600 }} 
              />
              <Chip 
                label={`${totals?.duration_total_min || 0} min Total`} 
                size="small"
                sx={{ bgcolor: '#fef3f2', color: '#f5576c', border: '1px solid #fecaca', fontWeight: 600 }} 
              />
              <Chip 
                label={`${Math.round(totals?.calories_total || 0)} kcal`} 
                size="small"
                sx={{ bgcolor: '#f0fdfa', color: '#14b8a6', border: '1px solid #ccfbf1', fontWeight: 600 }} 
              />
            </Stack>
          </Box>
          <Button
            variant={showDetails ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#e2e8f0',
              color: showDetails ? '#ffffff' : '#64748b',
              bgcolor: showDetails ? '#667eea' : 'transparent',
              '&:hover': {
                borderColor: '#667eea',
                bgcolor: showDetails ? '#5568d3' : '#f0f4ff',
                color: showDetails ? '#ffffff' : '#667eea'
              }
            }}
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </Button>
        </Stack>
      </Paper>

      {/* Simple Exercise List */}
      <Card 
        elevation={0}
        sx={{ 
          borderRadius: 3, 
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          mb: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 3 }}>
            Your Exercises ({allExercises.length} total)
          </Typography>
          
          <Stack spacing={2}>
            {allExercises.map((exercise, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  bgcolor: '#f8fafc',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#667eea',
                    bgcolor: '#f0f4ff'
                  }
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Exercise Number Badge */}
                  <Grid item xs={12} sm="auto">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        color: '#ffffff'
                      }}
                    >
                      {exercise.exerciseNumber}
                    </Box>
                  </Grid>

                  {/* Exercise Info */}
                  <Grid item xs={12} sm>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 1 }}>
                      {exercise.exercise}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={showDetails ? 2 : 0}>
                      <Chip 
                        label={exercise.category} 
                        size="small" 
                        sx={{ bgcolor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 500, height: 24, fontSize: '0.75rem' }} 
                      />
                      <Chip 
                        label={`${exercise.duration_min} min`} 
                        size="small" 
                        sx={{ bgcolor: '#fef3f2', color: '#f5576c', border: '1px solid #fecaca', fontWeight: 600, height: 24, fontSize: '0.75rem' }} 
                      />
                      <Chip 
                        label={exercise.intensity} 
                        size="small"
                        sx={{ 
                          bgcolor: '#ffffff',
                          color: getIntensityColor(exercise.intensity),
                          border: `1px solid ${getIntensityColor(exercise.intensity)}`,
                          fontWeight: 600,
                          height: 24,
                          fontSize: '0.75rem'
                        }}
                      />
                      {exercise.estimated_calories && (
                        <Chip 
                          label={`${exercise.estimated_calories} kcal`} 
                          size="small" 
                          sx={{ bgcolor: '#f0fdfa', color: '#14b8a6', border: '1px solid #ccfbf1', fontWeight: 600, height: 24, fontSize: '0.75rem' }} 
                        />
                      )}
                    </Stack>

                    {/* Detailed Information (Collapsible) */}
                    <Collapse in={showDetails} timeout="auto">
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                        {exercise.sessionTime && (
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box component="span" sx={{ fontWeight: 600 }}>Best Time:</Box> {exercise.sessionTime}
                          </Typography>
                        )}
                        
                        {exercise.notes && (
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 600 }}>Tips:</Box> {exercise.notes}
                          </Typography>
                        )}

                        {exercise.heart_rate_zone && exercise.heart_rate_zone !== 'N/A' && (
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 600 }}>Heart Rate:</Box> {exercise.heart_rate_zone}
                          </Typography>
                        )}

                        {exercise.mets && (
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 600 }}>Intensity (METs):</Box> {exercise.mets}
                          </Typography>
                        )}

                        {exercise.precautions?.length > 0 && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#fffbeb', borderRadius: 2, border: '1px solid #fde68a' }}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <WarningIcon sx={{ color: '#f59e0b', fontSize: 18, mt: 0.2 }} />
                              <Box>
                                <Typography variant="caption" fontWeight={600} sx={{ color: '#92400e', display: 'block', mb: 0.5 }}>
                                  Important Precautions
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#78350f', fontSize: '0.8rem' }}>
                                  {exercise.precautions.join(', ')}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Tips Section */}
      {tips?.length > 0 && (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
              💡 Daily Tips
            </Typography>
            <Stack spacing={1.5}>
              {tips.map((tip, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#f0f4ff',
                    borderLeft: '3px solid #667eea',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
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
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
              📚 Sources
            </Typography>
            <Stack spacing={1.5}>
              {sources.map((source, i) => (
                <Box 
                  key={i}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', mb: 0.5 }}>
                    {source.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
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
