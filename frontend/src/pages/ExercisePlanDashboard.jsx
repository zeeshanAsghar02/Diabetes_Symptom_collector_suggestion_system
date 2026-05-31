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

const EXERCISE_SYNTHESIS_STAGES = [
  { id: 1, label: 'Reading medical profile constraints', duration: 12 },
  { id: 2, label: 'Retrieving movement safety guidance', duration: 18 },
  { id: 3, label: 'Calibrating intensity and duration targets', duration: 30 },
  { id: 4, label: 'Authoring warmup and cardio blocks', duration: 45 },
  { id: 5, label: 'Balancing resistance and recovery load', duration: 45 },
  { id: 6, label: 'Checking workout safety boundaries', duration: 24 },
  { id: 7, label: 'Finalizing daily workout routine', duration: 18 }
];

const ExerciseSynthesisLoader = ({ elapsedSeconds = 0, complete = false }) => {
  const totalStageSeconds = EXERCISE_SYNTHESIS_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
  const progress = complete ? 100 : Math.min(99, Math.max(0, Math.round((elapsedSeconds / totalStageSeconds) * 100)));
  let accumulatedSeconds = 0;
  const activeStageIndex = EXERCISE_SYNTHESIS_STAGES.findIndex((stage) => {
    accumulatedSeconds += stage.duration;
    return elapsedSeconds < accumulatedSeconds;
  });
  const currentStageIndex = complete ? EXERCISE_SYNTHESIS_STAGES.length : (activeStageIndex === -1 ? EXERCISE_SYNTHESIS_STAGES.length - 1 : activeStageIndex);

  return (
    <Dialog open maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 1.5, bgcolor: '#0f1420', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 28px 90px rgba(2,6,23,0.62)' } }}>
      <DialogTitle sx={{ px: 3.5, pt: 3, pb: 0 }}>
        <Typography variant="h5" fontWeight={520} sx={{ color: '#fff', letterSpacing: '-0.045em' }}>
          AI Workout Synthesis
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3.5, pt: 3, pb: 3.5 }}>
        <Typography sx={{ color: 'rgba(203,213,225,0.72)', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', mb: 0.8 }}>
          AI Workout Synthesis:{' '}
          <Box component="span" sx={{ color: '#67e8f9', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontWeight: 500 }}>
            {progress}%
          </Box>
        </Typography>
        <Box
          sx={{
            height: 2,
            width: '100%',
            borderRadius: 999,
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.07)',
            position: 'relative',
            mb: 4,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #22d3ee, #34d399)',
              boxShadow: '0 0 22px rgba(34,211,238,0.32)',
              transition: 'width 0.5s cubic-bezier(0.1, 0.76, 0.55, 0.94)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.75), rgba(52,211,153,0.75), transparent)',
              animation: 'exerciseSynthesisWave 1.7s ease-in-out infinite',
            },
            '@keyframes exerciseSynthesisWave': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            },
          }}
        />
        <Stack spacing={1.55}>
          {EXERCISE_SYNTHESIS_STAGES.map((stage, index) => {
            const completed = index < currentStageIndex;
            const active = !complete && index === currentStageIndex;
            return (
              <Box key={stage.id} sx={{ display: 'grid', gridTemplateColumns: '26px 1fr', alignItems: 'center', columnGap: 1.4 }}>
                <Box sx={{ width: 22, height: 22, display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontSize: active ? 16 : 12, color: completed ? '#2dd4bf' : active ? '#67e8f9' : 'rgba(148,163,184,0.38)' }}>
                  {completed ? '✓' : active ? (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#67e8f9', boxShadow: '0 0 18px rgba(103,232,249,0.62)', animation: 'workoutPipelinePulse 1s ease-in-out infinite', '@keyframes workoutPipelinePulse': { '0%, 100%': { opacity: 0.45, transform: 'scale(0.75)' }, '50%': { opacity: 1, transform: 'scale(1.18)' } } }} />
                  ) : String(stage.id).padStart(2, '0')}
                </Box>
                <Typography sx={{ fontSize: { xs: 13, md: 14 }, fontWeight: active ? 520 : 430, color: completed ? 'rgba(226,232,240,0.9)' : active ? '#fff' : 'rgba(148,163,184,0.4)' }}>
                  {stage.label}
                  {active && <Box component="span" sx={{ color: '#67e8f9', ml: 0.8, letterSpacing: '0.14em' }}>...</Box>}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

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
  const [synthesisSeconds, setSynthesisSeconds] = useState(0);
  const [synthesisComplete, setSynthesisComplete] = useState(false);

  useEffect(() => {
    initializeExercisePlan();
  }, []);

  useEffect(() => {
    if (!autoGenerating && !generating) {
      setSynthesisSeconds(0);
      setSynthesisComplete(false);
      return undefined;
    }
    const interval = setInterval(() => setSynthesisSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [autoGenerating, generating]);

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
    setSynthesisComplete(false);
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
        setSynthesisComplete(true);
        await new Promise((resolve) => setTimeout(resolve, 450));
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
    setGenerating(true); setSynthesisComplete(false); setError(null); setSuccess(null);
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
        setSynthesisComplete(true);
        await new Promise((resolve) => setTimeout(resolve, 450));
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

  // Get the latest recent plans (excluding today)
  const getLast7DaysPlans = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return history
      .filter(plan => {
        const planDate = new Date(plan.target_date);
        planDate.setHours(0, 0, 0, 0);
        return planDate < today;
      })
      .slice(0, 6);
  };

  const last7Days = getLast7DaysPlans();

  return (
    <Box sx={{ minHeight: inModal ? '80vh' : '100vh', bgcolor: '#0b0f19', color: '#f8fafc', width: '100%', overflowX: 'hidden' }}>
      {(autoGenerating || generating) && <ExerciseSynthesisLoader elapsedSeconds={synthesisSeconds} complete={synthesisComplete} />}

      <Container maxWidth="lg" sx={{ py: 4, mt: inModal ? 0 : 6 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#2dd4bf' }} /></Box>
        ) : (
          <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1.5,
              p: 3,
              background: 'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(15,23,42,0.82) 100%)',
              border: 0,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 0%, rgba(34,211,238,0.16), transparent 30%)' }} />
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2} sx={{ position: 'relative' }}>
              <Box>
                <Typography variant="h5" fontWeight="560" sx={{ color: '#ffffff', mb: 0.5, letterSpacing: '-0.04em' }}>Exercise Plans</Typography>
                <Stack direction="row" spacing={1.5} mt={2} flexWrap="wrap" useFlexGap>
                  {regionCoverage && (
                    <Chip
                      label={regionCoverage.coverage}
                      size="small"
                      sx={{ height: 'auto', bgcolor: 'transparent', color: 'rgba(203,213,225,0.62)', border: 0, fontWeight: 420, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', '& .MuiChip-label': { px: 0 } }}
                    />
                  )}
                  <Chip
                    label={`${history.length || 0} Total Plans`}
                    size="small"
                    sx={{ height: 'auto', bgcolor: 'transparent', color: 'rgba(203,213,225,0.62)', border: 0, fontWeight: 420, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', '& .MuiChip-label': { px: 0 } }}
                  />
                  <Chip
                    label={`Recent: ${last7Days.length}`}
                    size="small"
                    sx={{ height: 'auto', bgcolor: 'transparent', color: 'rgba(203,213,225,0.62)', border: 0, fontWeight: 420, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', '& .MuiChip-label': { px: 0 } }}
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
                <Typography variant="h5" fontWeight={560} sx={{ color: '#fff', letterSpacing: '-0.04em' }}>
                  Today's Exercise Plan 🎯
                </Typography>
                <Chip
                  label="Current Day"
                  size="small"
                  sx={{
                    bgcolor: 'transparent',
                    color: '#34d399',
                    fontWeight: 600,
                    border: 0,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
                      '50%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' }
                    }
                  }}
                />
              </Box>
              <ExercisePlanView plan={todayPlan} />
            </Box>
          ) : (
            <Paper
              sx={{
                p: 4,
                borderRadius: 1.5,
                textAlign: 'center',
                bgcolor: 'rgba(17,24,39,0.45)',
                border: 0
              }}
            >
              <FitnessCenterIcon sx={{ fontSize: 52, color: 'rgba(103,232,249,0.42)', mb: 2 }} />
              <Typography variant="h6" fontWeight={560} sx={{ color: '#fff', mb: 1 }}>
                No plan for today yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)', mb: 2 }}>
                Click the button below to generate today's exercise plan
              </Typography>
              <Button
                variant="outlined"
                onClick={autoGenerateTodayPlan}
                disabled={autoGenerating}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  color: '#fff',
                  borderColor: 'rgba(45,212,191,0.35)',
                  '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.7)' }
                }}
              >
                {autoGenerating ? 'Generating...' : 'Generate Today\'s Plan'}
              </Button>
            </Paper>
          )}

          {/* Recent Plans */}
          {last7Days.length > 0 && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" fontWeight={560} sx={{ color: '#fff', mb: 2, letterSpacing: '-0.025em' }}>
                Recent Plans
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' },
                  gap: { xs: 1.5, lg: 0 },
                }}
              >
                {last7Days.map((plan, idx) => {
                  const planDate = new Date(plan.target_date);

                  return (
                    <Box
                      key={idx}
                      onClick={() => setTodayPlan(plan)}
                      sx={{
                        px: { xs: 0, lg: 2 },
                        py: { xs: 1.5, lg: 0 },
                        borderLeft: { xs: 0, lg: idx === 0 ? 0 : '1px solid rgba(255,255,255,0.05)' },
                        borderBottom: { xs: '1px solid rgba(255,255,255,0.05)', lg: 0 },
                        cursor: 'pointer',
                        transition: 'opacity 0.25s ease',
                        '&:hover': { opacity: 0.78 },
                      }}
                    >
                      <Stack spacing={1.1} alignItems={{ xs: 'flex-start', lg: 'center' }}>
                        <Box
                          sx={{
                            width: 46,
                            height: 46,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#fff',
                            border: '1px solid rgba(103,232,249,0.24)',
                            boxShadow: '0 0 22px rgba(103,232,249,0.08)',
                            fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                          }}
                        >
                          {planDate.getDate()}
                        </Box>
                        <Typography variant="body2" fontWeight={560} sx={{ color: '#fff' }}>
                          {planDate.toLocaleDateString('en-US', { month: 'short', weekday: 'short' })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.62)' }}>
                          {plan.totals?.duration_total_min || 0} min
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#67e8f9', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', textShadow: '0 0 14px rgba(103,232,249,0.18)' }}>
                          {Math.round(plan.totals?.calories_total || 0)} kcal
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
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
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.22)',
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.05)'
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
              sx={{ p: 4, borderRadius: 1.5, textAlign: 'center', border: 0, bgcolor: 'rgba(17,24,39,0.45)' }}
            >
              <Typography variant="body1" sx={{ color: 'rgba(203,213,225,0.68)' }}>
                No exercise plans yet. Generate your first plan to get started! 🚀
              </Typography>
            </Paper>
          )}
          </Stack>
        )}

        <Dialog
          open={showGenerator}
          onClose={()=>setShowGenerator(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 1.5, bgcolor: '#0f1420', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }}
        >
        <DialogTitle sx={{ fontWeight: 560, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Create Exercise Plan</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)', mb: 2 }}>Select a date for your exercise plan:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {generateDateOptions().map(d => (
              <Chip
                key={d}
                label={formatDate(d, 'DD MMMM')}
                onClick={()=>setSelectedDate(d)}
                clickable
                sx={{
                  fontWeight: 600,
                  bgcolor: 'transparent',
                  background: 'transparent',
                  color: selectedDate===d ? '#fff' : 'rgba(203,213,225,0.62)',
                  border: '1px solid',
                  borderColor: selectedDate===d ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.08)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(34,211,238,0.45)'
                  }
                }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={()=>setShowGenerator(false)}
            sx={{ textTransform: 'none', color: 'rgba(203,213,225,0.68)', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={handleGenerate}
            disabled={generating || !selectedDate}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              color: '#fff',
              borderColor: 'rgba(34,211,238,0.35)',
              '&:hover': { bgcolor: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.7)' },
              '&:disabled': { color: 'rgba(148,163,184,0.4)', borderColor: 'rgba(255,255,255,0.08)' }
            }}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ExercisePlanDashboard;
