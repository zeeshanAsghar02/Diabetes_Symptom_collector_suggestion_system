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
  const [activeTab, setActiveTab] = useState(0); // 0 = Daily, 1 = Monthly
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

      // Try to fetch today's plan
      const today = new Date().toISOString().split('T')[0];
      try {
        const todayRes = await axiosInstance.get(`/diet-plan/date/${today}`);
        if (todayRes.data.plan) {
          setSelectedPlan(todayRes.data.plan);
        }
      } catch (err) {
        // No plan for today - that's okay
      }

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

  // If a plan is selected, show the detailed view
  if (selectedPlan) {
    return (
      <DietPlanView 
        plan={selectedPlan} 
        onBack={() => setSelectedPlan(null)}
        onDelete={handleDeletePlan}
      />
    );
  }

  // If Monthly tab is active, show MonthlyDietPlanDashboard
  if (activeTab === 1) {
    return (
      <Box>
        {/* Tab Navigation */}
        <Container maxWidth="lg" sx={{ pt: inModal ? 2 : 4, mt: inModal ? 0 : 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              mb: 3,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #d1fae5'
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#10b981',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minHeight: 56,
                  color: '#64748b',
                  '&.Mui-selected': {
                    color: '#10b981'
                  }
                }
              }}
            >
              <Tab
                icon={<TodayIcon sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label="Daily Plans"
              />
              <Tab
                icon={<DateRangeIcon sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label="Monthly Plans"
              />
            </Tabs>
          </Paper>
        </Container>
        <MonthlyDietPlanDashboard inModal={inModal} />
      </Box>
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
    <Container maxWidth="lg" sx={{ py: inModal ? 2 : 4, mt: inModal ? 0 : 6, position: 'relative', color: '#0f172a' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 6,
          background: 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.06), transparent 30%), radial-gradient(circle at 80% 0%, rgba(245,158,11,0.08), transparent 28%), linear-gradient(135deg, #f8fafc 0%, #ecfdf5 50%, #fef3c7 100%)',
          zIndex: -1
        }}
      />

      <Stack spacing={3}>
        {/* Tabs Navigation */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            p: { xs: 2, md: 2 },
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #d1fae5'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#10b981',
                height: 3,
                borderRadius: '3px 3px 0 0'
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 56,
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#10b981'
                }
              }
            }}
          >
            <Tab
              icon={<TodayIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Daily Plans"
            />
            <Tab
              icon={<DateRangeIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Monthly Plans"
            />
          </Tabs>
        </Paper>

        {/* Hero Header */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            color: '#1f2937',
            border: '1px solid #d1fae5'
          }}
        >
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight="700" sx={{ letterSpacing: '-0.5px', color: '#1e293b', mb: 1 }}>
                <RestaurantIcon sx={{ fontSize: 32, verticalAlign: 'middle', mr: 1, color: '#10b981' }} />
                Nutrition & Diet Plan
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                Personalized meal plans powered by evidence-based dietary guidelines
              </Typography>
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" gap={1}>
                {regionCoverage ? (
                  <Chip
                    label={`${regionCoverage.region}`}
                    size="small"
                    sx={{ bgcolor: '#ffffff', color: '#10b981', borderColor: '#d1fae5', fontWeight: 600 }}
                    variant="outlined"
                  />
                ) : null}
                <Chip 
                  label={`${dietHistory.length} Plans`} 
                  size="small"
                  sx={{ bgcolor: '#ffffff', color: '#64748b', fontWeight: 600 }} 
                />
              </Stack>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                size="medium"
                onClick={() => {
                  setShowGenerator(true);
                  setSelectedDate(dateOptions[0].value);
                }}
                startIcon={<RestaurantIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  bgcolor: '#10b981',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#059669', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }
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
                  fontWeight: 600,
                  color: '#64748b',
                  borderColor: '#e2e8f0',
                  '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ borderRadius: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

      {/* Diet History Section - Full Width */}
      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: '#1e293b' }}>
            <TrendingUpIcon sx={{ mr: 1, color: '#10b981' }} />
            Your Diet History
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          {dietHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <RestaurantIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#64748b', mb: 1, fontWeight: 500 }}>
                No diet plans yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Click "Create Diet Plan" above to generate your first personalized meal plan
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {dietHistory.map((plan) => (
                <Grid item xs={12} sm={6} md={4} key={plan._id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': { 
                        borderColor: '#10b981', 
                        bgcolor: '#f0fdf4', 
                        transform: 'translateY(-4px)', 
                        boxShadow: '0 8px 20px rgba(16,185,129,0.15)' 
                      }
                    }}
                    onClick={() => handleViewPlan(plan)}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight="700" sx={{ color: '#1e293b', mb: 0.5 }}>
                        {formatDate(plan.target_date, 'DD MMMM')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {formatDate(plan.target_date)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      bgcolor: '#f0fdf4', 
                      borderRadius: 1.5, 
                      p: 1.5, 
                      mb: 2,
                      border: '1px solid #d1fae5'
                    }}>
                      <Typography variant="h5" fontWeight="700" sx={{ color: '#10b981', mb: 0.5 }}>
                        {calculateActualCalories(plan)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                        kcal
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                        <PublicIcon sx={{ fontSize: 14, mr: 0.5 }} />
                        {plan.region}
                      </Typography>
                      <Chip
                        size="small"
                        label={plan.status}
                        sx={{
                          bgcolor: plan.status === 'completed' ? '#ecfdf5' : '#f1f5f9',
                          color: plan.status === 'completed' ? '#10b981' : '#64748b',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 22,
                          border: '1px solid',
                          borderColor: plan.status === 'completed' ? '#d1fae5' : '#e2e8f0'
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card elevation={0} sx={{ mt: 3, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: '#1e293b' }}>
            <WarningIcon sx={{ mr: 1, color: '#f59e0b' }} />
            Important Notes
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: '#78350f', lineHeight: 1.6 }}>
              • Diet plans are personalized based on your profile and regional dietary guidelines
            </Typography>
            <Typography variant="body2" sx={{ color: '#78350f', lineHeight: 1.6 }}>
              • Plans will adjust based on your glucose levels (when glucose monitoring is enabled)
            </Typography>
            <Typography variant="body2" sx={{ color: '#78350f', lineHeight: 1.6 }}>
              • Only one diet plan can be generated per day
            </Typography>
            <Typography variant="body2" sx={{ color: '#78350f', lineHeight: 1.6 }}>
              • Consult your doctor before making major dietary changes
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Date Selection Dialog */}
      <Dialog open={showGenerator} onClose={() => setShowGenerator(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Generate Diet Plan
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
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
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(option.dateObj)}
                      </Typography>
                    </Box>
                  }
                  sx={{ my: 1, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1 }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerator(false)} disabled={generating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGeneratePlan}
            disabled={!selectedDate || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <RestaurantIcon />}
            sx={{
              bgcolor: '#10b981',
              color: '#fff',
              '&:hover': { bgcolor: '#059669' },
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
