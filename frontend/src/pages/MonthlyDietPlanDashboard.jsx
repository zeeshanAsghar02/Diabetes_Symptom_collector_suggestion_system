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
  Skeleton
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

// Progress stages for the loading animation. Durations are only used to rotate
// the active stage; the UI deliberately avoids promising a fixed completion time.
const LOADING_STAGES = [
  { id: 1, label: "Analyzing your health profile", duration: 12 },
  { id: 2, label: "Searching regional food database", duration: 18 },
  { id: 3, label: "Consulting AI nutrition expert", duration: 30 },
  { id: 4, label: "Creating breakfast and snack options", duration: 45 },
  { id: 5, label: "Designing lunch and dinner choices", duration: 45 },
  { id: 6, label: "Checking nutritional balance", duration: 24 },
  { id: 7, label: "Finalizing your personalized plan", duration: 18 }
];

const getRollingGenerationMonths = () => {
  const now = new Date();
  return Array.from({ length: 3 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      label: date.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    };
  });
};

const isCurrentCalendarMonth = (plan) => {
  const now = new Date();
  return Number(plan?.month) === now.getMonth() + 1 && Number(plan?.year) === now.getFullYear();
};

const AiSynthesisLoading = ({ elapsedSeconds = 0 }) => {
  const totalStageSeconds = LOADING_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
  const progress = Math.min(95, Math.max(8, Math.round((elapsedSeconds / totalStageSeconds) * 100)));
  let accumulatedSeconds = 0;
  const activeStageIndex = LOADING_STAGES.findIndex((stage) => {
    accumulatedSeconds += stage.duration;
    return elapsedSeconds < accumulatedSeconds;
  });
  const currentStageIndex = activeStageIndex === -1 ? LOADING_STAGES.length - 1 : activeStageIndex;

  return (
    <Box
      sx={{
        minHeight: 300,
        px: { xs: 0, md: 1 },
        py: 1,
      }}
    >
      <Typography
        sx={{
          color: 'rgba(203,213,225,0.72)',
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          mb: 0.7,
        }}
      >
        Progress:{' '}
        <Box component="span" sx={{ color: '#67e8f9', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontWeight: 500 }}>
          {progress}%
        </Box>
      </Typography>

      <Box
        sx={{
          height: 2,
          width: '100%',
          maxWidth: 620,
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
            backgroundSize: '220% 100%',
            animation: 'aiSynthesisWave 1.7s ease-in-out infinite',
          },
          '@keyframes aiSynthesisWave': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      />

      <Stack spacing={1.55}>
        {LOADING_STAGES.map((stage, index) => {
          const completed = index < currentStageIndex;
          const active = index === currentStageIndex;

          return (
            <Box
              key={stage.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '26px 1fr',
                alignItems: 'center',
                columnGap: 1.4,
                color: completed || active ? '#fff' : 'rgba(148,163,184,0.38)',
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
                  fontSize: active ? 16 : 12,
                  color: completed ? '#2dd4bf' : active ? '#67e8f9' : 'rgba(148,163,184,0.38)',
                }}
              >
                {completed ? (
                  '✓'
                ) : active ? (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#67e8f9',
                      boxShadow: '0 0 18px rgba(103,232,249,0.62)',
                      animation: 'pipelinePulse 1s ease-in-out infinite',
                      '@keyframes pipelinePulse': {
                        '0%, 100%': { opacity: 0.45, transform: 'scale(0.75)' },
                        '50%': { opacity: 1, transform: 'scale(1.18)' },
                      },
                    }}
                  />
                ) : (
                  String(stage.id).padStart(2, '0')
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: 13, md: 14 },
                  fontWeight: active ? 520 : 430,
                  letterSpacing: active ? '0.01em' : 0,
                  color: completed ? 'rgba(226,232,240,0.9)' : active ? '#fff' : 'rgba(148,163,184,0.4)',
                }}
              >
                {stage.label}
                {active && (
                  <Box component="span" sx={{ color: '#67e8f9', ml: 0.8, letterSpacing: '0.14em' }}>
                    ...
                  </Box>
                )}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

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

  // Update stage based on elapsed time, then stay on the final stage until
  // server polling reports completion.
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

  const stageCycleSeconds = LOADING_STAGES.reduce((sum, s) => sum + s.duration, 0);
  const progress = Math.min((elapsedSeconds / stageCycleSeconds) * 100, 95);

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
                AI-powered personalization in progress. This can finish sooner or take a little longer depending on server load.
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={`${formatTime(elapsedSeconds)} elapsed`}
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
              Generation progress
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Waiting for server confirmation
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
  const generationMonths = useMemo(() => getRollingGenerationMonths(), []);
  const [selectedWindow, setSelectedWindow] = useState(generationMonths[0]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  useEffect(() => {
    if (open && !loading) setSelectedWindow(generationMonths[0]);
  }, [open, loading, generationMonths]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={loading ? "md" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          bgcolor: '#0f1420',
          color: '#fff',
          boxShadow: '0 28px 90px rgba(2,6,23,0.55)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'max-width 0.3s ease'
        }
      }}
    >
      <DialogTitle sx={{ pb: 0, px: { xs: 2.5, md: 3.5 }, pt: 3 }}>
        <Typography variant="h5" component="span" fontWeight={520} sx={{ color: '#fff', display: 'block', letterSpacing: '-0.045em' }}>
          {loading ? 'AI Nutrition Synthesis' : 'Initialize Diet Matrix'}
        </Typography>
        {!loading && (
          <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.6)', mt: 0.7 }}>
            Select a data window for your personalized monthly targets.
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2, px: { xs: 2.5, md: 3.5 } }}>
        {loading ? (
          <AiSynthesisLoading elapsedSeconds={elapsedSeconds} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: { xs: 2.2, sm: 4.2 },
              py: 2,
            }}
          >
            {generationMonths.map((option) => {
              const selected = option.month === selectedWindow.month && option.year === selectedWindow.year;
              return (
                <Button
                  key={`${option.month}-${option.year}`}
                  type="button"
                  onClick={() => setSelectedWindow(option)}
                  sx={{
                    minHeight: 0,
                    borderRadius: 0,
                    textTransform: 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'left',
                    px: 0,
                    py: 0.8,
                    pb: 1.05,
                    color: selected ? '#fff' : 'rgba(203,213,225,0.62)',
                    bgcolor: 'transparent',
                    border: 0,
                    borderBottom: selected ? '1px solid rgba(34,211,238,0.68)' : '1px solid transparent',
                    transition: 'all 0.28s ease',
                    minWidth: 'auto',
                    '&:hover': {
                      color: '#fff',
                      bgcolor: 'transparent',
                      borderBottomColor: 'rgba(34,211,238,0.45)',
                      textShadow: '0 0 18px rgba(34,211,238,0.25)',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={selected ? 560 : 430}
                    sx={{
                      color: 'inherit',
                      letterSpacing: '0.01em',
                      fontSize: { xs: 13.5, sm: 14.5 },
                    }}
                  >
                    {option.label}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, md: 3.5 }, pb: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: 'rgba(203,213,225,0.7)',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onGenerate(selectedWindow.month, selectedWindow.year)}
          disabled={loading}
          variant="outlined"
          sx={{
            borderColor: 'rgba(34,211,238,0.35)',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            borderRadius: 1.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.7)', boxShadow: 'none' },
            '&:disabled': { color: 'rgba(148,163,184,0.4)', borderColor: 'rgba(255,255,255,0.08)' }
          }}
        >
          {loading ? 'Generating...' : 'Confirm & Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color = '#10b981' }) => (
  <Box
    sx={{
      py: 1.5,
      minWidth: 0,
    }}
  >
    <Stack direction="row" spacing={1.25} alignItems="center">
      {React.createElement(Icon, { sx: { color, fontSize: 18, opacity: 0.86 } })}
      <Box>
        <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.72)', fontWeight: 650, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography
          variant="h6"
          fontWeight={340}
          sx={{
            color: '#fff',
            lineHeight: 1.2,
            fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
            textShadow: `0 0 16px ${alpha(color, 0.2)}`,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  </Box>
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
    const pollState = pollAbortRef.current;
    isMountedRef.current = true;
    fetchMonthlyPlans();
    return () => {
      isMountedRef.current = false;
      pollState.aborted = true;
    };
  }, []);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollUntilComplete = async ({ month, year, maxWaitMs = 20 * 60 * 1000 }) => {
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
    const allowed = getRollingGenerationMonths().some((option) => option.month === Number(month) && option.year === Number(year));
    if (!allowed) {
      setError('Monthly plans can only be generated for the current month and the next two months.');
      return;
    }

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
        timeout: 480000
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
    } catch {
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
    <Container maxWidth="xl" sx={{ py: inModal ? 2 : 4, mt: inModal ? 0 : 6, color: '#f8fafc' }}>
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
              <Typography variant="h4" fontWeight={560} sx={{ color: '#fff', mb: 0.5, letterSpacing: '-0.055em' }}>
                Monthly Diet Plans
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>
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
                  color: 'rgba(226,232,240,0.76)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1.5,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.2)', bgcolor: 'rgba(255,255,255,0.04)' }
                }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowGenerator(true)}
                startIcon={<AddIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#fff',
                  borderColor: 'rgba(45,212,191,0.35)',
                  borderRadius: 1.5,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.7)', boxShadow: 'none' }
                }}
              >
                New Plan
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Stats Row */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={0}
          divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: { xs: 0, sm: 3 } }} />}
        >
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
        <Box>
          {monthlyPlans.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <RestaurantIcon sx={{ fontSize: 32, color: 'rgba(45,212,191,0.45)' }} />
              </Box>
              <Typography variant="h6" fontWeight={560} sx={{ color: '#fff', mb: 0.5 }}>
                No monthly plans yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)', mb: 3, maxWidth: 400, mx: 'auto' }}>
                Generate your first monthly plan to get personalized meal options for the entire month
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setShowGenerator(true)}
                startIcon={<AddIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#fff',
                  borderColor: 'rgba(45,212,191,0.35)',
                  borderRadius: 1.5,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.7)' }
                }}
              >
                Create Monthly Plan
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ background: 'transparent' }}>
              <Table sx={{ background: 'transparent' }}>
                <TableHead>
                  <TableRow>
                    {['Period', 'Region', 'Daily Target', 'Options'].map((heading) => (
                      <TableCell key={heading} sx={{ fontWeight: 650, color: 'rgba(148,163,184,0.72)', py: 1.7, borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                        {heading}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 650, color: 'rgba(148,163,184,0.72)', py: 1.7, borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyPlans.map((plan) => (
                    <TableRow
                      key={plan._id}
                      sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease-out',
                        bgcolor: 'transparent',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                        '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)' },
                        '&:last-child td': { borderBottom: '1px solid rgba(255,255,255,0.04)' },
                        ...(isCurrentCalendarMonth(plan) ? {
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 1,
                            background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)',
                            backgroundSize: '220% 100%',
                            animation: 'monthlyPulseLine 1.8s ease-in-out infinite',
                          },
                          '@keyframes monthlyPulseLine': {
                            '0%': { backgroundPosition: '220% 0', opacity: 0.2 },
                            '50%': { opacity: 1 },
                            '100%': { backgroundPosition: '-220% 0', opacity: 0.2 },
                          }
                        } : {})
                      }}
                      onClick={() => handleOpenPlan(plan)}
                    >
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2.2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box>
                            <Typography variant="body2" fontWeight={560} sx={{ color: '#fff' }}>
                              {getMonthName(plan.month)} {plan.year}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2.2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)' }}>
                          {plan.region}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2.2 }}>
                        <Typography variant="body2" fontWeight={360} sx={{ color: '#67e8f9', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', textShadow: '0 0 14px rgba(103,232,249,0.18)' }}>
                          {plan.total_daily_calories} kcal
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2.2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)' }}>
                          {getTotalOptions(plan)} options
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2.2 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenPlan(plan, e)}
                              sx={{ color: 'rgba(203,213,225,0.45)', '& svg': { fontSize: 18 }, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeletePlan(plan._id, e)}
                              sx={{ color: 'rgba(203,213,225,0.45)', '& svg': { fontSize: 18 }, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}
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
        </Box>

        {/* Info Section */}
        <Box sx={{ pt: 1 }}>
          <Typography variant="subtitle1" fontWeight={560} sx={{ color: '#fff', mb: 2, letterSpacing: '-0.025em' }}>
            How Monthly Plans Work
          </Typography>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={3}
            divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />}
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
                    bgcolor: 'transparent',
                    color: '#2dd4bf',
                    border: '1px solid rgba(45,212,191,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 520,
                    fontSize: '0.875rem',
                    flexShrink: 0
                  }}
                >
                  {item.step}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={560} sx={{ color: '#fff' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.6)' }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
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
