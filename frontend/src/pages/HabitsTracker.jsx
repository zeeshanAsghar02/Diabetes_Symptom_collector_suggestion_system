import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Grid, Card, CardContent, Typography, Checkbox, FormControlLabel, 
  Chip, LinearProgress, Button, Alert, Skeleton, Paper, Divider, IconButton,
  Tooltip, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import PsychologyIcon from '@mui/icons-material/Psychology';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import axiosInstance from '../utils/axiosInstance';

const HabitsTracker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [weeklyHabits, setWeeklyHabits] = useState(null);

  useEffect(() => {
    fetchWeeklyHabits();
  }, []);

  const fetchWeeklyHabits = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/habits/current');
      
      if (response.data.success && response.data.data) {
        setWeeklyHabits(response.data.data);
        setError('');
      } else {
        setWeeklyHabits(null);
      }
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError(err.response?.data?.message || 'Unable to load habits');
    } finally {
      setLoading(false);
    }
  };

  const generateNewHabits = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const response = await axiosInstance.post('/habits/generate');
      
      if (response.data.success) {
        setWeeklyHabits(response.data.data);
        setError('');
      }
    } catch (err) {
      console.error('Error generating habits:', err);
      setError(err.response?.data?.message || 'Unable to generate habits. Please complete your health profile first.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleHabit = async (habitId, date) => {
    try {
      const habitProgress = weeklyHabits.progress.find(
        p => p.habitId === habitId && new Date(p.date).toDateString() === date.toDateString()
      );
      
      const completed = !habitProgress?.completed;
      
      const response = await axiosInstance.post('/habits/progress', {
        habitId,
        date: date.toISOString(),
        completed
      });
      
      if (response.data.success) {
        setWeeklyHabits(response.data.data);
      }
    } catch (err) {
      console.error('Error updating habit:', err);
      setError('Failed to update habit progress');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      diet: <RestaurantIcon />,
      exercise: <FitnessCenterIcon />,
      medication: <LocalHospitalIcon />,
      lifestyle: <SelfImprovementIcon />,
      sleep: <BedtimeIcon />,
      stress: <PsychologyIcon />,
      monitoring: <LocalHospitalIcon />
    };
    return icons[category] || <InfoOutlinedIcon />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      diet: '#10b981',
      exercise: '#3b82f6',
      medication: '#ef4444',
      lifestyle: '#8b5cf6',
      sleep: '#6366f1',
      stress: '#ec4899',
      monitoring: '#f59e0b'
    };
    return colors[category] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#059669'
    };
    return colors[priority] || '#6b7280';
  };

  const getHabitProgress = (habitId) => {
    if (!weeklyHabits) return { todayCompleted: false, weekCount: 0 };
    
    const today = new Date();
    const todayProgress = weeklyHabits.progress.find(
      p => p.habitId === habitId && new Date(p.date).toDateString() === today.toDateString()
    );
    
    const weekCount = weeklyHabits.progress.filter(
      p => p.habitId === habitId && p.completed
    ).length;
    
    return {
      todayCompleted: todayProgress?.completed || false,
      weekCount
    };
  };

  const getWeekProgress = () => {
    if (!weeklyHabits || !weeklyHabits.habits.length) return { completed: 0, total: 0, percentage: 0 };
    
    const totalHabits = weeklyHabits.habits.length * 7;
    const completed = weeklyHabits.progress.filter(p => p.completed).length;
    const percentage = Math.round((completed / totalHabits) * 100);
    
    return { completed, total: totalHabits, percentage };
  };

  const isWeekExpired = () => {
    if (!weeklyHabits) return false;
    return new Date() > new Date(weeklyHabits.weekEndDate);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafb', py: 4 }}>
        <Container maxWidth="lg">
          <Skeleton height={80} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton height={220} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  const weekProgress = getWeekProgress();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafb', py: 4 }}>
      <Container maxWidth="lg">
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white' 
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                Daily Habits Tracker
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {weeklyHabits 
                  ? 'AI-generated personalized habits based on your health profile'
                  : 'Generate your personalized weekly habits plan'
                }
              </Typography>
            </Box>
            {weeklyHabits && (
              <Tooltip title={isWeekExpired() ? "Generate new week's habits" : "Regenerate habits"}>
                <IconButton 
                  onClick={generateNewHabits}
                  disabled={generating}
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}
                >
                  {generating ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          {weeklyHabits && (
            <>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.9 }}>
                  Week: {new Date(weeklyHabits.weekStartDate).toLocaleDateString()} - {new Date(weeklyHabits.weekEndDate).toLocaleDateString()}
                </Typography>
                {isWeekExpired() && (
                  <Chip 
                    label="Week Expired - Generate New Habits"
                    size="small"
                    sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 600 }}
                  />
                )}
              </Box>

              <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight="600">
                    This Week's Progress
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {weekProgress.completed} / {weekProgress.total} ({weekProgress.percentage}%)
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={weekProgress.percentage}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#fff',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            </>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!weeklyHabits && !loading && (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h5" fontWeight="600" sx={{ mb: 2, color: '#1e293b' }}>
              Ready to Build Better Habits?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Generate your personalized weekly habit plan based on your health profile and diabetes management needs.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={generateNewHabits}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} /> : null}
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                }
              }}
            >
              {generating ? 'Generating Your Habits...' : 'Generate My Weekly Habits'}
            </Button>
          </Paper>
        )}

        {weeklyHabits && weeklyHabits.habits && (
          <>
            <Typography variant="h5" fontWeight="600" sx={{ mb: 3, color: '#1e293b' }}>
              Your Personalized Habits
            </Typography>

            <Grid container spacing={3}>
              {weeklyHabits.habits.map((habit) => {
                const progress = getHabitProgress(habit.id);
                const color = getCategoryColor(habit.category);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={habit.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        border: progress.todayCompleted ? `2px solid ${color}` : '1px solid #e2e8f0',
                        bgcolor: progress.todayCompleted ? `${color}08` : '#fff',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          boxShadow: `0 8px 25px ${color}25`,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <Box 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: 2, 
                              bgcolor: `${color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: color
                            }}
                          >
                            {getCategoryIcon(habit.category)}
                          </Box>
                          <Chip 
                            size="small"
                            label={habit.priority.toUpperCase()}
                            sx={{
                              bgcolor: `${getPriorityColor(habit.priority)}15`,
                              color: getPriorityColor(habit.priority),
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>

                        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#1e293b' }}>
                          {habit.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                          {habit.description}
                        </Typography>

                        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafb', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: '#475569' }}>
                            Target: {habit.targetValue} {habit.unit}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                            Frequency: {habit.frequency.replace(/_/g, ' ')}
                          </Typography>
                          {habit.timeOfDay && habit.timeOfDay.length > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                              Time: {habit.timeOfDay.join(', ')}
                            </Typography>
                          )}
                        </Box>

                        {habit.medicalReason && (
                          <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem', py: 0.5 }}>
                            {habit.medicalReason}
                          </Alert>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={progress.todayCompleted}
                              onChange={() => handleToggleHabit(habit.id, new Date())}
                              sx={{
                                color: color,
                                '&.Mui-checked': {
                                  color: color,
                                },
                              }}
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight="500">
                              {progress.todayCompleted ? 'Completed today!' : 'Mark as done today'}
                            </Typography>
                          }
                        />

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            This week: {progress.weekCount}/7 days
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {[...Array(7)].map((_, dayIndex) => (
                              <Box
                                key={dayIndex}
                                sx={{
                                  flex: 1,
                                  height: 8,
                                  borderRadius: 1,
                                  bgcolor: dayIndex < progress.weekCount ? color : '#e2e8f0',
                                  transition: 'all 0.2s ease'
                                }}
                              />
                            ))}
                          </Box>
                        </Box>

                        {habit.tips && habit.tips.length > 0 && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e2e8f0' }}>
                            <Typography variant="caption" fontWeight="600" sx={{ display: 'block', mb: 0.5, color: '#475569' }}>
                              Tips:
                            </Typography>
                            {habit.tips.slice(0, 2).map((tip, idx) => (
                              <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#64748b', mb: 0.25 }}>
                                • {tip}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained"
            onClick={() => navigate('/personalized-suggestions/diet-plan')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            View Diet Plans
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate('/personalized-suggestions/exercise-plan')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Exercise Plans
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HabitsTracker;
