// Monthly Diet Plan Dashboard - Premium Professional Design
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  alpha,
  Fade,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  LocalDining as DiningIcon,
  TrendingUp as TrendingUpIcon,
  FreeBreakfast as BreakfastIcon,
  LunchDining as LunchIcon,
  DinnerDining as DinnerIcon,
  Cake as SnackIcon,
  Psychology as AIIcon,
  AutoAwesome as SparkleIcon,
  Lightbulb as TipIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import MonthlyDietPlanView from './MonthlyDietPlanView';

// Nutrition tips to show during loading
const NUTRITION_TIPS = [
  { tip: "Eating fiber-rich foods helps slow glucose absorption", icon: "🥗" },
  { tip: "Protein at every meal helps maintain stable blood sugar", icon: "🥚" },
  { tip: "Cinnamon may help improve insulin sensitivity", icon: "✨" },
  { tip: "Staying hydrated is crucial for blood sugar management", icon: "💧" },
  { tip: "Small, frequent meals help prevent sugar spikes", icon: "🍽️" },
  { tip: "Walking after meals can lower blood sugar by 30%", icon: "🚶" },
  { tip: "Vinegar before meals may reduce glucose response", icon: "🫒" },
  { tip: "Sleep quality directly affects insulin sensitivity", icon: "😴" },
  { tip: "Leafy greens are nutrient-dense with minimal carbs", icon: "🥬" },
  { tip: "Nuts are excellent for blood sugar control", icon: "🥜" },
  { tip: "Legumes have a low glycemic index despite carb content", icon: "🫘" },
  { tip: "Berries are the best fruit choice for diabetics", icon: "🫐" }
];

// Progress stages for the loading animation
const LOADING_STAGES = [
  { id: 1, label: "Analyzing your health profile", duration: 15 },
  { id: 2, label: "Searching regional food database", duration: 30 },
  { id: 3, label: "Consulting AI nutrition expert", duration: 60 },
  { id: 4, label: "Creating breakfast & lunch options", duration: 90 },
  { id: 5, label: "Designing dinner & snack plans", duration: 120 },
  { id: 6, label: "Calculating nutritional values", duration: 30 },
  { id: 7, label: "Finalizing your personalized plan", duration: 15 }
];

// Engaging Loading Component
const EngagingLoadingOverlay = ({ isLoading, elapsedSeconds }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Rotate tips every 8 seconds
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % NUTRITION_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Update stage based on elapsed time
  useEffect(() => {
    if (!isLoading) return;
    let accumulated = 0;
    for (let i = 0; i < LOADING_STAGES.length; i++) {
      accumulated += LOADING_STAGES[i].duration;
      if (elapsedSeconds < accumulated) {
        setCurrentStage(i);
        break;
      } else if (i === LOADING_STAGES.length - 1) {
        setCurrentStage(LOADING_STAGES.length - 1);
      }
    }
    // Show skeleton preview after 60 seconds
    setShowSkeleton(elapsedSeconds > 60);
  }, [isLoading, elapsedSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const estimatedTotal = LOADING_STAGES.reduce((sum, s) => sum + s.duration, 0);
  const progress = Math.min((elapsedSeconds / estimatedTotal) * 100, 98);

  if (!isLoading) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: alpha('#10b981', 0.03),
        border: '2px solid',
        borderColor: alpha('#10b981', 0.2),
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Animated gradient border */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6, #10b981)',
          backgroundSize: '300% 100%',
          animation: 'shimmer 2s linear infinite',
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '100% 0' },
            '100%': { backgroundPosition: '0% 0' }
          }
        }}
      />

      <Stack spacing={3}>
        {/* Header with time */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: alpha('#10b981', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' }
                }
              }}
            >
              <AIIcon sx={{ color: '#10b981', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
                Creating Your Plan
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                AI-powered personalization in progress
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={formatTime(elapsedSeconds)}
            size="small"
            sx={{
              bgcolor: alpha('#3b82f6', 0.1),
              color: '#3b82f6',
              fontWeight: 600,
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}
          />
        </Stack>

        {/* Progress bar */}
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight={600} sx={{ color: '#475569' }}>
              Progress: {Math.round(progress)}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              ~{formatTime(Math.max(0, estimatedTotal - elapsedSeconds))} remaining
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha('#10b981', 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #10b981, #059669)'
              }
            }}
          />
        </Box>

        {/* Current stage indicator */}
        <Stack spacing={1}>
          {LOADING_STAGES.map((stage, index) => (
            <Fade in={index <= currentStage} key={stage.id}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  opacity: index === currentStage ? 1 : index < currentStage ? 0.5 : 0.3,
                  transition: 'all 0.3s ease'
                }}
              >
                {index < currentStage ? (
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
                ) : index === currentStage ? (
                  <CircularProgress size={16} thickness={6} sx={{ color: '#10b981' }} />
                ) : (
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0' }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: index === currentStage ? '#1e293b' : '#64748b',
                    fontWeight: index === currentStage ? 600 : 400
                  }}
                >
                  {stage.label}
                </Typography>
              </Stack>
            </Fade>
          ))}
        </Stack>

        {/* Nutrition tip card */}
        <Fade in key={currentTipIndex}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: alpha('#f59e0b', 0.08),
              border: '1px solid',
              borderColor: alpha('#f59e0b', 0.2),
              borderRadius: 2
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography fontSize={28}>{NUTRITION_TIPS[currentTipIndex].icon}</Typography>
              <Box>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                  <TipIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                  <Typography variant="caption" fontWeight={600} sx={{ color: '#b45309' }}>
                    DID YOU KNOW?
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: '#78350f' }}>
                  {NUTRITION_TIPS[currentTipIndex].tip}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Fade>

        {/* Preview skeleton - shows after 60 seconds */}
        {showSkeleton && (
          <Fade in>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: '#64748b', mb: 1.5, display: 'block' }}>
                <SparkleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                Preparing your meals...
              </Typography>
              <Stack direction="row" spacing={2}>
                {[
                  { icon: <BreakfastIcon />, label: 'Breakfast' },
                  { icon: <LunchIcon />, label: 'Lunch' },
                  { icon: <DinnerIcon />, label: 'Dinner' }
                ].map((meal, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 1.5,
                      border: '1px solid',
                      borderColor: '#e2e8f0',
                      borderRadius: 2,
                      bgcolor: '#fff'
                    }}
                  >
                    <Stack spacing={1} alignItems="center">
                      <Box sx={{ color: '#10b981' }}>{meal.icon}</Box>
                      <Typography variant="caption" fontWeight={600} sx={{ color: '#64748b' }}>
                        {meal.label}
                      </Typography>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Fade>
        )}
      </Stack>
    </Paper>
  );
};

// Premium Month Selector Dialog
const MonthSelectorDialog = ({ open, onClose, onGenerate, loading }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    years.push(currentYear + i);
  }

  // Track elapsed time during loading
  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={loading ? "md" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'max-width 0.3s ease'
        }
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Typography variant="h5" component="span" fontWeight={700} sx={{ color: '#1e293b', display: 'block' }}>
          {loading ? '🍽️ Crafting Your Meal Plan' : 'Generate Monthly Plan'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          {loading 
            ? 'Our AI is designing personalized meals based on your health profile'
            : 'Create a personalized diet plan with multiple meal options'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Stack spacing={2.5}>
          {!loading && (
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                  disabled={loading}
                  sx={{ borderRadius: 1.5 }}
                >
                  {months.map((month, index) => (
                    <MenuItem key={index + 1} value={index + 1}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                  disabled={loading}
                  sx={{ borderRadius: 1.5 }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {loading ? (
            <EngagingLoadingOverlay isLoading={loading} elapsedSeconds={elapsedSeconds} />
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: '#f8fafc',
                border: '1px solid',
                borderColor: '#e2e8f0',
                borderRadius: 2
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1e293b', mb: 1.5 }}>
                Plan includes:
              </Typography>
              <Stack spacing={1}>
                {[
                  'Personalized meal options for 5 meal types',
                  'Breakfast, lunch, dinner & 2 snacks',
                  'Complete nutritional breakdown',
                  'Based on your health profile & region'
                ].map((item, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                    <Typography variant="body2" sx={{ color: '#475569' }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: '#64748b',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#f1f5f9' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onGenerate(selectedMonth, selectedYear)}
          disabled={loading}
          variant="contained"
          sx={{
            bgcolor: '#10b981',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            borderRadius: 1.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#059669', boxShadow: 'none' },
            '&:disabled': { bgcolor: alpha('#10b981', 0.5) }
          }}
        >
          {loading ? 'Generating...' : 'Generate Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color = '#10b981' }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: '#e2e8f0',
      bgcolor: '#fff',
      transition: 'all 0.2s',
      '&:hover': { borderColor: color, boxShadow: `0 4px 12px ${alpha(color, 0.1)}` }
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: alpha(color, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon sx={{ color, fontSize: 20 }} />
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const MonthlyDietPlanDashboard = ({ inModal = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [monthlyPlans, setMonthlyPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const isMountedRef = useRef(true);
  const pollAbortRef = useRef({ aborted: false });

  const pollIntervalMs = useMemo(() => 3500, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchMonthlyPlans();
    return () => {
      isMountedRef.current = false;
      pollAbortRef.current.aborted = true;
    };
  }, []);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollUntilComplete = async ({ month, year, maxWaitMs = 15 * 60 * 1000 }) => {
    const startedAt = Date.now();
    pollAbortRef.current.aborted = false;

    while (!pollAbortRef.current.aborted) {
      const statusRes = await axiosInstance.get(`/monthly-diet-plan/status/${month}/${year}`, {
        timeout: 15000
      });

      const status = statusRes.data?.status;
      const plan = statusRes.data?.plan;
      const errorMsg = statusRes.data?.error;

      if (status === 'complete') {
        return { status, plan };
      }
      if (status === 'failed') {
        throw new Error(errorMsg || 'Monthly plan generation failed');
      }
      if (Date.now() - startedAt > maxWaitMs) {
        throw new Error('Monthly diet plan generation is taking too long. Please check History after a few minutes.');
      }

      await sleep(pollIntervalMs);
    }

    throw new Error('Generation polling aborted');
  };

  const fetchMonthlyPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/monthly-diet-plan/history?limit=12');
      setMonthlyPlans(response.data.plans || []);
    } catch (err) {
      console.error('Error fetching monthly plans:', err);
      setError(err.response?.data?.error || 'Failed to load monthly diet plans');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (month, year) => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Backend returns 202 immediately and generates in background.
      // Keep dialog open + poll status until complete.
      const response = await axiosInstance.post('/monthly-diet-plan/generate', {
        month,
        year
      }, {
        timeout: 30000
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to start monthly plan generation');
      }

      const serverStatus = response.data?.status;
      if (serverStatus && serverStatus !== 'pending') {
        // Unexpected, but handle gracefully (no fallback plan content).
        throw new Error(`Unexpected generation status: ${serverStatus}`);
      }

      const { plan } = await pollUntilComplete({ month, year });
      if (!isMountedRef.current) return;

      setSuccess(`Monthly diet plan for ${getMonthName(month)} ${year} generated successfully`);
      setShowGenerator(false);
      await fetchMonthlyPlans();
      if (plan) setSelectedPlan(plan);
    } catch (err) {
      console.error('Error generating monthly plan:', err);
      const apiErr = err.response?.data?.error;
      setError(apiErr || err.message || 'Failed to generate monthly diet plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenPlan = async (plan, event) => {
    event?.stopPropagation();
    setError(null);
    setSuccess(null);

    if (plan?.generation_status === 'pending') {
      setShowGenerator(true);
      setGenerating(true);
      try {
        const { plan: completedPlan } = await pollUntilComplete({ month: plan.month, year: plan.year });
        if (!isMountedRef.current) return;
        setShowGenerator(false);
        await fetchMonthlyPlans();
        if (completedPlan) setSelectedPlan(completedPlan);
      } catch (err) {
        console.error('Error while polling pending plan:', err);
        setError(err.message || 'Failed to load plan status');
      } finally {
        setGenerating(false);
      }
      return;
    }

    if (plan?.generation_status === 'failed') {
      setError(plan?.generation_error || 'This monthly plan failed to generate. Delete it and try again.');
      return;
    }

    setSelectedPlan(plan);
  };

  const handleDeletePlan = async (planId, event) => {
    event?.stopPropagation();
    if (!window.confirm('Delete this monthly diet plan?')) return;

    try {
      await axiosInstance.delete(`/monthly-diet-plan/${planId}`);
      setSuccess('Plan deleted successfully');
      await fetchMonthlyPlans();
      if (selectedPlan?._id === planId) setSelectedPlan(null);
    } catch (err) {
      setError('Failed to delete plan');
    }
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const getTotalOptions = (plan) => {
    if (!plan.meal_categories) return 0;
    return plan.meal_categories.reduce((sum, cat) => sum + (cat.options?.length || 0), 0);
  };

  if (selectedPlan) {
    return (
      <MonthlyDietPlanView
        plan={selectedPlan}
        onBack={() => setSelectedPlan(null)}
        onDelete={handleDeletePlan}
      />
    );
  }

  if (loading && monthlyPlans.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress sx={{ color: '#10b981' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: inModal ? 2 : 4, mt: inModal ? 0 : 6 }}>
      <Stack spacing={3}>
        {/* Header Section */}
        <Box>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
                Monthly Diet Plans
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Personalized meal options for flexibility throughout the month
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                size="small"
                onClick={fetchMonthlyPlans}
                startIcon={<RefreshIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#64748b',
                  borderColor: '#e2e8f0',
                  borderRadius: 1.5,
                  '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => setShowGenerator(true)}
                startIcon={<AddIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#10b981',
                  borderRadius: 1.5,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
                }}
              >
                New Plan
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Stats Row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <StatCard 
            icon={CalendarIcon} 
            label="Total Plans" 
            value={monthlyPlans.length} 
            color="#10b981" 
          />
          <StatCard 
            icon={DiningIcon} 
            label="Meal Options" 
            value={monthlyPlans.reduce((sum, p) => sum + getTotalOptions(p), 0)} 
            color="#3b82f6" 
          />
          <StatCard 
            icon={TrendingUpIcon} 
            label="Active Plans" 
            value={monthlyPlans.filter(p => p.status === 'active').length} 
            color="#f59e0b" 
          />
        </Stack>

        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ borderRadius: 2 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success" 
            sx={{ borderRadius: 2 }} 
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Plans Table */}
        <Card 
          elevation={0} 
          sx={{ 
            border: '1px solid', 
            borderColor: '#e2e8f0', 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {monthlyPlans.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <RestaurantIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1e293b', mb: 0.5 }}>
                No monthly plans yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3, maxWidth: 400, mx: 'auto' }}>
                Generate your first monthly plan to get personalized meal options for the entire month
              </Typography>
              <Button
                variant="contained"
                onClick={() => setShowGenerator(true)}
                startIcon={<AddIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#10b981',
                  borderRadius: 1.5,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Create Monthly Plan
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Region</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Daily Target</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Options</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyPlans.map((plan) => (
                    <TableRow
                      key={plan._id}
                      sx={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        '&:hover': { bgcolor: '#f8fafc' },
                        '&:last-child td': { borderBottom: 0 }
                      }}
                      onClick={() => handleOpenPlan(plan)}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1,
                              bgcolor: alpha('#10b981', 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CalendarIcon sx={{ fontSize: 18, color: '#10b981' }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
                              {getMonthName(plan.month)} {plan.year}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {new Date(plan.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={plan.region}
                          size="small"
                          sx={{
                            bgcolor: alpha('#3b82f6', 0.1),
                            color: '#3b82f6',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
                          {plan.total_daily_calories} kcal
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {getTotalOptions(plan)} options
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={plan.generation_status === 'complete' && plan.status === 'active' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined}
                          label={plan.generation_status === 'pending'
                            ? 'Generating'
                            : plan.generation_status === 'failed'
                              ? 'Failed'
                              : plan.status}
                          size="small"
                          sx={{
                            bgcolor: plan.generation_status === 'pending'
                              ? alpha('#3b82f6', 0.1)
                              : plan.generation_status === 'failed'
                                ? alpha('#ef4444', 0.1)
                                : plan.status === 'active'
                                  ? alpha('#10b981', 0.1)
                                  : '#f1f5f9',
                            color: plan.generation_status === 'pending'
                              ? '#3b82f6'
                              : plan.generation_status === 'failed'
                                ? '#ef4444'
                                : plan.status === 'active'
                                  ? '#10b981'
                                  : '#64748b',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenPlan(plan, e)}
                              sx={{ color: '#64748b', '&:hover': { color: '#10b981', bgcolor: alpha('#10b981', 0.1) } }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeletePlan(plan._id, e)}
                              sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.1) } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Info Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: '#e2e8f0',
            bgcolor: '#fff'
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1e293b', mb: 2 }}>
            How Monthly Plans Work
          </Typography>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={3}
            divider={<Divider orientation="vertical" flexItem />}
          >
            {[
              { step: '1', title: 'Generate', desc: 'Create a plan with 5 options per meal type' },
              { step: '2', title: 'Choose', desc: 'Select different options each day for variety' },
              { step: '3', title: 'Track', desc: 'Monitor your nutrition throughout the month' }
            ].map((item) => (
              <Stack key={item.step} direction="row" spacing={2} alignItems="flex-start" flex={1}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    flexShrink: 0
                  }}
                >
                  {item.step}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1e293b' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>

      {/* Generation Dialog */}
      <MonthSelectorDialog
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onGenerate={handleGeneratePlan}
        loading={generating}
      />
    </Container>
  );
};

export default MonthlyDietPlanDashboard;
