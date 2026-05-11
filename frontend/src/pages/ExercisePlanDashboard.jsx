import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  FitnessCenter as FitnessCenterIcon,
  Public as PublicIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import ExercisePlanView from './ExercisePlanView';
import AIGenerationLoader from '../components/loaders/AIGenerationLoader';

const StatTile = ({ label, value, accent }) => (
  <Paper
    variant="outlined"
    sx={{
      px: 2,
      py: 1.5,
      borderRadius: 2,
      borderColor: '#e2e8f0',
      bgcolor: '#ffffff',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: accent,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }
    }}
  >
    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
    <Typography variant="h6" fontWeight={700} sx={{ color: accent }}>{value}</Typography>
  </Paper>
);

const ExercisePlanDashboard = ({ inModal = false }) => {
  const { formatDate } = useDateFormat();
  const [loading, setLoading] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [regionCoverage, setRegionCoverage] = useState(null);
  const [history, setHistory] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { 
    initializeExercisePlan(); 
  }, []);

  const clearTodaysPlan = async () => {
    if (!window.confirm('Are you sure you want to delete today\'s exercise plan? This cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    setError(null);
    try {
      const response = await axiosInstance.delete('/dev/clear-today');
      if (response.data.success) {
        setSuccess(`Deleted ${response.data.deletedCount} plan(s). Refreshing...`);
        setTodayPlan(null);
        
        // Refresh after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setError('Failed to clear plan: ' + (err.response?.data?.error || err.message));
    } finally {
      setClearing(false);
    }
  };

  const initializeExercisePlan = async () => {
    setLoading(true);
    try {
      // First, get region coverage
      const coverageRes = await axiosInstance.get('/exercise-plan/region-coverage');
      setRegionCoverage(coverageRes.data.coverage);
      
      // Get today's date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if today's plan exists
      let todayPlanExists = false;
      try {
        const todayRes = await axiosInstance.get(`/exercise-plan/date/${todayStr}`);
        if (todayRes.data.success && todayRes.data.plan) {
          setTodayPlan(todayRes.data.plan);
          todayPlanExists = true;
          console.log('✅ Today\'s plan already exists');
        }
      } catch (err) {
        // Plan doesn't exist, will auto-generate
        console.log('ℹ️ Today\'s plan does not exist, will auto-generate');
      }
      
      // Get history (last 30 days for filtering later)
      const historyRes = await axiosInstance.get('/exercise-plan/history?limit=30');
      const plans = historyRes.data.plans || historyRes.data.data || [];
      setHistory(plans);
      
      // If today's plan doesn't exist, auto-generate it
      if (!todayPlanExists) {
        await autoGenerateTodayPlan();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load exercise plan data');
    } finally { 
      setLoading(false); 
    }
  };

  const autoGenerateTodayPlan = async () => {
    setAutoGenerating(true);
    setError(null);
    try {
      console.log('🤖 Auto-generating today\'s exercise plan...');
      const res = await axiosInstance.post('/exercise-plan/auto-generate');
      
      if (res.data.success) {
        setTodayPlan(res.data.plan);
        setSuccess('Exercise plan generated successfully! 🎉');
        
        // Refresh history
        const historyRes = await axiosInstance.get('/exercise-plan/history?limit=30');
        setHistory(historyRes.data.plans || historyRes.data.data || []);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Failed to auto-generate exercise plan';
      
      if (status === 400) {
        setError(msg.includes('profile') ? 'Please complete Personal Info in onboarding before generating an exercise plan.' : msg);
      } else if (status === 401) {
        setError('You are signed out. Please sign in again to generate a plan.');
      } else if (status === 503) {
        setError('AI is currently processing. Please wait a moment and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setAutoGenerating(false);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i <= 5; i++) {
      const d = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000));
      // Use local date components to avoid timezone conversion issues
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  const handleGenerate = async () => {
    if (!selectedDate) { setError('Please select a date'); return; }
    setGenerating(true); setError(null); setSuccess(null);
    try {
      const res = await axiosInstance.post('/exercise-plan/generate', { target_date: selectedDate });
      if (res.data.success) {
        const emailMessage = res.data.emailSent ? ' A copy has been sent to your email.' : '';
        setSuccess('Exercise plan generated successfully!' + emailMessage);
        setShowGenerator(false);
        
        // Refresh data
        await initializeExercisePlan();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Failed to generate exercise plan';
      if (status === 409) {
        setError('An exercise plan for this date already exists. Open it from History or pick another date.');
      } else if (status === 400) {
        setError(msg.includes('profile') ? 'Please complete Personal Info in onboarding before generating an exercise plan.' : msg);
      } else if (status === 401) {
        setError('You are signed out. Please sign in again to generate a plan.');
      } else if (status === 503) {
        setError('AI is currently processing. Please wait a moment and try again.');
      } else {
        setError(msg);
      }
    } finally { setGenerating(false); }
  };

  // Get last 7 days plans (excluding today)
  const getLast7DaysPlans = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return history
      .filter(plan => {
        const planDate = new Date(plan.target_date);
        planDate.setHours(0, 0, 0, 0);
        return planDate < today;
      })
      .slice(0, 7);
  };

  const last7Days = getLast7DaysPlans();

  // Show loader when auto-generating
  if (autoGenerating) {
    return <AIGenerationLoader message="Generating your personalized exercise plan for today..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: inModal ? 0 : 6, color: '#0f172a' }}>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2} sx={{ position: 'relative' }}>
              <Box>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff', mb: 0.5 }}>Exercise Plans</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                  AI-powered personalized exercise plans tailored to your health profile
                </Typography>
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" gap={1}>
                  {regionCoverage && (
                    <Chip
                      label={`${regionCoverage.region} • ${regionCoverage.coverage}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600 }}
                    />
                  )}
                  <Chip 
                    label={`${history.length || 0} Total Plans`} 
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600 }} 
                  />
                  <Chip 
                    icon={<CalendarIcon sx={{ color: '#ffffff !important', fontSize: '16px !important' }} />}
                    label={`Last 7 Days: ${last7Days.length}`} 
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600 }} 
                  />
                </Stack>
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={initializeExercisePlan}
                  disabled={loading || autoGenerating}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 2,
                    '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Refresh
                </Button>
                {todayPlan && (
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={clearTodaysPlan}
                    disabled={clearing || loading || autoGenerating}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: '#ffffff',
                      borderColor: 'rgba(255,100,100,0.5)',
                      borderRadius: 2,
                      '&:hover': { borderColor: 'rgba(255,100,100,0.8)', bgcolor: 'rgba(255,100,100,0.1)' }
                    }}
                  >
                    {clearing ? 'Clearing...' : 'Clear Today\'s Plan'}
                  </Button>
                )}
              </Stack>
            </Box>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 1, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

          {/* Today's Plan Section */}
          {todayPlan ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#1e293b' }}>
                  Today's Exercise Plan 🎯
                </Typography>
                <Chip 
                  label="Current Day" 
                  size="small"
                  sx={{ 
                    bgcolor: '#10b981', 
                    color: '#ffffff', 
                    fontWeight: 600,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
                      '50%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' }
                    }
                  }} 
                />
              </Box>
              <Card sx={{ borderRadius: 3, border: '2px solid #10b981', bgcolor: '#ffffff', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)' }}>
                <CardContent>
                  <ExercisePlanView plan={todayPlan} />
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Paper
              variant="outlined"
              sx={{ 
                p: 4, 
                borderRadius: 3, 
                textAlign: 'center', 
                borderColor: '#e2e8f0', 
                bgcolor: '#f8fafc',
                border: '2px dashed #cbd5e1'
              }}
            >
              <FitnessCenterIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} sx={{ color: '#64748b', mb: 1 }}>
                No plan for today yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                Click the button below to generate today's exercise plan
              </Typography>
              <Button
                variant="contained"
                onClick={autoGenerateTodayPlan}
                disabled={autoGenerating}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)' }
                }}
              >
                {autoGenerating ? 'Generating...' : 'Generate Today\'s Plan'}
              </Button>
            </Paper>
          )}

          {/* Divider */}
          {last7Days.length > 0 && (
            <Divider sx={{ my: 4 }}>
              <Chip label="Recent Plans (Last 7 Days)" sx={{ bgcolor: '#f8fafc', color: '#64748b', fontWeight: 600 }} />
            </Divider>
          )}

          {/* Recent 7 Days Plans - Pills Display */}
          {last7Days.length > 0 && (
            <Box>
              <Grid container spacing={2}>
                {last7Days.map((plan, idx) => {
                  const planDate = new Date(plan.target_date);
                  const daysAgo = Math.floor((new Date() - planDate) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          bgcolor: '#ffffff',
                          transition: 'all 0.3s',
                          height: '100%',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px rgba(102,126,234,0.15)',
                            borderColor: '#667eea'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                mb: 1
                              }}
                            >
                              <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff' }}>
                                {planDate.getDate()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="600" sx={{ color: '#1e293b', mb: 0.5 }}>
                              {planDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
                            </Typography>
                            <Chip 
                              label={daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`} 
                              size="small" 
                              sx={{ 
                                bgcolor: '#f0f4ff', 
                                color: '#667eea', 
                                fontWeight: 600, 
                                fontSize: '0.7rem',
                                height: 20 
                              }} 
                            />
                          </Box>
                          <Divider sx={{ my: 1.5 }} />
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Region</Typography>
                              <Chip label={plan.region || 'Global'} size="small" sx={{ bgcolor: '#f0f4ff', color: '#667eea', fontWeight: 600, height: 20, fontSize: '0.7rem' }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Duration</Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ color: '#1e293b', fontSize: '0.85rem' }}>
                                {plan.totals?.duration_total_min || 0} min
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Sessions</Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ color: '#1e293b', fontSize: '0.85rem' }}>
                                {plan.totals?.sessions_count || 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Calories</Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ color: '#1e293b', fontSize: '0.85rem' }}>
                                {Math.round(plan.totals?.calories_total || 0)} kcal
                              </Typography>
                            </Box>
                          </Stack>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => setTodayPlan(plan)}
                            sx={{
                              mt: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              borderColor: '#e2e8f0',
                              color: '#667eea',
                              '&:hover': {
                                borderColor: '#667eea',
                                bgcolor: '#f0f4ff'
                              }
                            }}
                          >
                            View Plan
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Manual Generation Button */}
          <Box sx={{ textAlign: 'center', pt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setShowGenerator(true);
                setSelectedDate(generateDateOptions()[1]); // Default to tomorrow
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#667eea',
                  color: '#667eea',
                  bgcolor: '#f0f4ff'
                }
              }}
            >
              Create Plan for Another Day
            </Button>
          </Box>

          {/* No history message */}
          {!todayPlan && last7Days.length === 0 && (
            <Paper
              variant="outlined"
              sx={{ p: 4, borderRadius: 3, textAlign: 'center', borderColor: '#e2e8f0', bgcolor: '#ffffff' }}
            >
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                No exercise plans yet. Generate your first plan to get started! 🚀
              </Typography>
            </Paper>
          )}
        </Stack>
      )}

      <Dialog open={showGenerator} onClose={()=>setShowGenerator(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#1e293b', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)', borderBottom: '1px solid #e2e8f0' }}>Create Exercise Plan</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>Select a date for your exercise plan:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {generateDateOptions().map(d => (
              <Chip 
                key={d} 
                label={formatDate(d, 'DD MMMM')} 
                onClick={()=>setSelectedDate(d)}
                clickable
                sx={{ 
                  fontWeight: 600,
                  bgcolor: selectedDate===d ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8fafc',
                  background: selectedDate===d ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8fafc',
                  color: selectedDate===d ? '#fff' : '#64748b',
                  border: '1px solid',
                  borderColor: selectedDate===d ? '#667eea' : '#e2e8f0',
                  '&:hover': {
                    background: selectedDate===d ? 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)' : '#f1f5f9',
                    borderColor: selectedDate===d ? '#5568d3' : '#cbd5e1'
                  }
                }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, background: '#f8fafc' }}>
          <Button 
            onClick={()=>setShowGenerator(false)} 
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerate} 
            disabled={generating || !selectedDate}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600, 
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)' },
              '&:disabled': { background: '#e2e8f0', color: '#94a3b8' }
            }}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExercisePlanDashboard;
