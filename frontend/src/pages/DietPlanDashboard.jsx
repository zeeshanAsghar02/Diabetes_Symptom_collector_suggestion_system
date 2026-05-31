// Diet Plan Dashboard - AI-powered meal planning
import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Public as PublicIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import DietPlanView from './DietPlanView';
import MonthlyDietPlanDashboard from './MonthlyDietPlanDashboard';

const StatTile = ({ label, value, accent, icon }) => (
  <Paper
    variant="outlined"
    sx={{
      px: 2,
      py: 1.5,
      borderRadius: 2,
      borderColor: '#e2e8f0',
      background: 'linear-gradient(145deg, #fff 0%, #f8fafc 100%)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 20px ${accent}30`,
        borderColor: accent
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
      {icon && <Box component="span" sx={{ fontSize: '1rem' }}>{icon}</Box>}
      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>{label}</Typography>
    </Box>
    <Typography variant="h6" fontWeight={800} sx={{ color: accent }}>{value}</Typography>
  </Paper>
);

const DietPlanDashboard = ({ inModal = false }) => {
  const { formatDate } = useDateFormat();
  const [activeTab, setActiveTab] = useState(0); // 0 = Monthly, 1 = Daily
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [nutritionProfile, setNutritionProfile] = useState(null);
  const [regionCoverage, setRegionCoverage] = useState(null);
  const [dietHistory, setDietHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedPlan(null);
  };

  // Calculate actual calories from meals - ALWAYS calculate from actual meal data
  const calculateActualCalories = (plan) => {
    // Priority 1: ALWAYS calculate from meals first (most accurate - actual food items)
    if (plan.meals && Array.isArray(plan.meals) && plan.meals.length > 0) {
      const mealTotal = plan.meals.reduce((sum, meal) => {
        // Try meal.total_calories first
        if (meal.total_calories && typeof meal.total_calories === 'number') {
          return sum + meal.total_calories;
        }
        // Fall back to summing items
        if (meal.items && Array.isArray(meal.items)) {
          const itemSum = meal.items.reduce((mealSum, item) => {
            return mealSum + (typeof item.calories === 'number' ? item.calories : 0);
          }, 0);
          return sum + itemSum;
        }
        return sum;
      }, 0);

      if (mealTotal > 0) {
        console.log(`Plan ${plan._id}: Calculated from meals = ${mealTotal}`);
        return Math.round(mealTotal);
      }
    }

    // Priority 2: Check nutritional_totals.calories (backup)
    if (plan.nutritional_totals && typeof plan.nutritional_totals.calories === 'number' && plan.nutritional_totals.calories > 0) {
      console.log(`Plan ${plan._id}: Using nutritional_totals.calories = ${plan.nutritional_totals.calories}`);
      return Math.round(plan.nutritional_totals.calories);
    }

    // Priority 3: Fall back to total_calories (target value)
    console.log(`Plan ${plan._id}: Using total_calories fallback = ${plan.total_calories}`);
    return Math.round(plan.total_calories || 0);
  };

  // Generate date options (today + 5 days)
  const generateDateOptions = () => {
    const options = [];
    const today = new Date();

    for (let i = 0; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDate(date),
        dateObj: date
      });
    }

    return options;
  };

  const dateOptions = generateDateOptions();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch region coverage
      const coverageRes = await axiosInstance.get('/diet-plan/region-coverage');
      setRegionCoverage(coverageRes.data.coverage);

      // Fetch diet plan history
      const historyRes = await axiosInstance.get('/diet-plan/history?limit=10');
      const plans = historyRes.data.plans || [];

      // Log each plan's calorie data for debugging
      console.log('📋 Diet Plans Loaded:');
      plans.forEach(plan => {
        console.log(`Plan ${plan._id}:`, {
          target_date: plan.target_date,
          total_calories: plan.total_calories,
          nutritional_totals: plan.nutritional_totals,
          meals_count: plan.meals?.length
        });
      });

      setDietHistory(plans);

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(err.response?.data?.error || 'Failed to load diet plan data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axiosInstance.post('/diet-plan/generate', {
        target_date: selectedDate
      });

      if (response.data.success) {
        const emailMessage = response.data.emailSent ? ' A copy has been sent to your email.' : '';
        setSuccess('Diet plan generated successfully!' + emailMessage);
        setSelectedPlan(response.data.plan);
        setShowGenerator(false);

        // Refresh history
        const historyRes = await axiosInstance.get('/diet-plan/history?limit=10');
        setDietHistory(historyRes.data.plans || []);
      }
    } catch (err) {
      console.error('Error generating diet plan:', err);
      setError(err.response?.data?.error || 'Failed to generate diet plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewPlan = async (plan) => {
    setSelectedPlan(plan);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this diet plan?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/diet-plan/${planId}`);
      setSuccess('Diet plan deleted successfully');

      // Refresh history
      const historyRes = await axiosInstance.get('/diet-plan/history?limit=10');
      setDietHistory(historyRes.data.plans || []);

      // If deleted plan was selected, clear it
      if (selectedPlan?._id === planId) {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete diet plan');
    }
  };

  // If Monthly tab is active, show MonthlyDietPlanDashboard
  if (activeTab === 0) {
    return (
      <Box sx={{ minHeight: '100%', bgcolor: '#0f1420', color: '#f8fafc' }}>
        {/* Tab Navigation */}
        <Container maxWidth="lg" sx={{ pt: inModal ? 2.5 : 4, mt: inModal ? 0 : 6 }}>
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#2dd4bf',
                  height: 2,
                  borderRadius: 999,
                  boxShadow: '0 0 14px rgba(45,212,191,0.55)',
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 620,
                  fontSize: '0.9rem',
                  minHeight: 42,
                  color: 'rgba(203,213,225,0.52)',
                  '&.Mui-selected': {
                    color: '#fff'
                  }
                }
              }}
            >
              <Tab
                icon={<DateRangeIcon sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label="Monthly Plans"
              />
              <Tab
                icon={<TodayIcon sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label="Daily Plans"
              />
            </Tabs>
          </Box>
        </Container>
        <MonthlyDietPlanDashboard inModal={inModal} />
      </Box>
    );
  }

  // Only show the daily detail view after the user explicitly opens or generates one.
  if (selectedPlan) {
    return (
      <DietPlanView
        plan={selectedPlan}
        onBack={() => setSelectedPlan(null)}
        onDelete={handleDeletePlan}
      />
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: inModal ? 3 : 4,
        mt: inModal ? 0 : 6,
        position: 'relative',
        color: '#f8fafc',
        minHeight: inModal ? '85vh' : '100vh',
        bgcolor: '#0f1420',
        fontFamily: '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 18% 6%, rgba(45,212,191,0.13), transparent 30%), radial-gradient(circle at 86% 12%, rgba(34,211,238,0.11), transparent 28%), linear-gradient(135deg, #0f1420 0%, #111827 54%, #0b0f19 100%)',
          zIndex: -1
        }}
      />

      <Stack spacing={3}>
        {/* Tabs Navigation */}
        <Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#2dd4bf',
                height: 2,
                borderRadius: 999,
                boxShadow: '0 0 14px rgba(45,212,191,0.55)',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 620,
                fontSize: '0.9rem',
                minHeight: 42,
                color: 'rgba(203,213,225,0.52)',
                '&.Mui-selected': {
                  color: '#fff'
                }
              }
            }}
          >
            <Tab
              icon={<DateRangeIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Monthly Plans"
            />
            <Tab
              icon={<TodayIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Daily Plans"
            />
          </Tabs>
        </Box>

        {/* Hero Header */}
        <Box sx={{ p: { xs: 0, md: 0 }, color: '#f8fafc' }}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={560} sx={{ letterSpacing: '-0.055em', color: '#fff', mb: 0.75 }}>
                <RestaurantIcon sx={{ fontSize: 27, verticalAlign: 'middle', mr: 1, color: '#2dd4bf', filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.25))' }} />
                Nutrition & Diet Plan
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)', fontSize: '0.84rem' }}>
                Personalized meal plans powered by evidence-based dietary guidelines
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="outlined"
                size="medium"
                onClick={() => {
                  setShowGenerator(true);
                  setSelectedDate(dateOptions[0].value);
                }}
                startIcon={<RestaurantIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 650,
                  px: 3,
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.025)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.36)' }
                }}
              >
                Create Diet Plan
              </Button>
              <Button
                variant="outlined"
                size="medium"
                onClick={fetchInitialData}
                sx={{
                  textTransform: 'none',
                  fontWeight: 650,
                  color: 'rgba(226,232,240,0.78)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  bgcolor: 'rgba(255,255,255,0.02)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.18)', bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2, bgcolor: 'rgba(251,146,60,0.1)', color: '#fed7aa' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ borderRadius: 2, bgcolor: 'rgba(16,185,129,0.1)', color: '#a7f3d0' }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

      {/* Diet History Section - Full Width */}
      <Box sx={{ py: { xs: 2.25, md: 3 }, px: 0 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 560, color: '#fff', letterSpacing: '-0.035em' }}>
            <TrendingUpIcon sx={{ mr: 1, color: '#2dd4bf', fontSize: 20 }} />
            Your Diet History
          </Typography>
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

          {dietHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <RestaurantIcon sx={{ fontSize: 54, color: 'rgba(45,212,191,0.38)', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#fff', mb: 1, fontWeight: 520 }}>
                No diet plans yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.55)' }}>
                Click "Create Diet Plan" above to generate your first personalized meal plan
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                columnGap: { xs: 0, md: 5 },
                rowGap: 0,
                pt: 1,
                pb: 1.5,
              }}
            >
              {dietHistory.slice(0, 6).map((plan, index) => (
                <Box
                  key={plan._id}
                  onClick={() => handleViewPlan(plan)}
                  sx={{
                    py: { xs: 2.4, md: 2.8 },
                    pl: { xs: 0, md: index % 2 === 1 ? 3.2 : 0 },
                    pr: { xs: 0, md: index % 2 === 0 ? 3.2 : 0 },
                    borderLeft: { xs: 'none', md: index % 2 === 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' },
                    borderTop: index > 1 ? '1px solid rgba(255,255,255,0.045)' : { xs: index > 0 ? '1px solid rgba(255,255,255,0.045)' : 'none', md: 'none' },
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, opacity 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      opacity: 0.92,
                    },
                  }}
                >
                  <Typography variant="h6" fontWeight={500} sx={{ color: '#fff', letterSpacing: '-0.035em', mb: 0.65 }}>
                    {formatDate(plan.target_date, 'DD MMMM')}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={320}
                    sx={{
                      color: '#67e8f9',
                      fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                      textShadow: '0 0 18px rgba(103,232,249,0.24)',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {calculateActualCalories(plan)} kcal
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
      </Box>

      {/* Important Notes */}
      <Card elevation={0} sx={{ mt: 3, bgcolor: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.12)', borderRadius: 3, boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 560, color: '#fff' }}>
            <WarningIcon sx={{ mr: 1, color: '#fbbf24', fontSize: 20 }} />
            Important Notes
          </Typography>
          <Divider sx={{ my: 2, borderColor: 'rgba(251,191,36,0.12)' }} />
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: 'rgba(254,243,199,0.72)', lineHeight: 1.6 }}>
              • Diet plans are personalized based on your profile and regional dietary guidelines
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(254,243,199,0.72)', lineHeight: 1.6 }}>
              • Plans will adjust based on your glucose levels (when glucose monitoring is enabled)
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(254,243,199,0.72)', lineHeight: 1.6 }}>
              • Only one diet plan can be generated per day
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(254,243,199,0.72)', lineHeight: 1.6 }}>
              • Consult your doctor before making major dietary changes
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Date Selection Dialog */}
      <Dialog
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#111827',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            boxShadow: '0 28px 90px rgba(2,6,23,0.5)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Generate Diet Plan
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.65)' }} paragraph>
            Select a date to generate your personalized meal plan:
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {dateOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio sx={{ color: 'rgba(203,213,225,0.42)', '&.Mui-checked': { color: '#2dd4bf' } }} />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ color: '#fff' }}>{option.label}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.55)' }}>
                        {formatDate(option.dateObj)}
                      </Typography>
                    </Box>
                  }
                  sx={{ my: 1, p: 1.5, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.025)' }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2, bgcolor: 'rgba(251,146,60,0.1)', color: '#fed7aa' }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerator(false)} disabled={generating} sx={{ color: 'rgba(203,213,225,0.7)' }}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={handleGeneratePlan}
            disabled={!selectedDate || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <RestaurantIcon />}
            sx={{
              color: '#fff',
              borderColor: 'rgba(45,212,191,0.35)',
              '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.7)' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {generating ? 'Generating...' : 'Generate Plan'}
          </Button>
        </DialogActions>
      </Dialog>
      </Stack>
    </Container>
  );
};

export default DietPlanDashboard;
