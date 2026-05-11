import React, { useState } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ShoppingCart as ShoppingCartIcon,
  Public as PublicIcon,
  ExpandMore as ExpandMoreIcon,
  Today as TodayIcon,
  Event as EventIcon
} from '@mui/icons-material';

const DietPlanView = ({ plan, onBack, onDelete }) => {
  const { formatDate } = useDateFormat();
  const [expandedMeals, setExpandedMeals] = useState({});

  if (!plan) return null;

  // Calculate actual totals from meals dynamically
  const calculateActualTotals = () => {
    if (!plan.meals || !Array.isArray(plan.meals)) {
      return {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0
      };
    }

    const totals = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0
    };

    plan.meals.forEach(meal => {
      // Use meal.total_calories if available, otherwise sum from items
      if (meal.total_calories) {
        totals.calories += Number(meal.total_calories) || 0;
      } else if (meal.items && Array.isArray(meal.items)) {
        meal.items.forEach(item => {
          totals.calories += Number(item.calories) || 0;
        });
      }

      // Sum macros from items
      if (meal.items && Array.isArray(meal.items)) {
        meal.items.forEach(item => {
          totals.carbs += Number(item.carbs) || 0;
          totals.protein += Number(item.protein) || 0;
          totals.fat += Number(item.fat) || 0;
          totals.fiber += Number(item.fiber) || 0;
        });
      }
    });

    return {
      calories: Math.round(totals.calories),
      carbs: Math.round(totals.carbs * 10) / 10,
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10
    };
  };

  const actualTotals = calculateActualTotals();

  const toggleMeal = (idx) => {
    setExpandedMeals(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getMealBorderColor = (index) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];
    return colors[index % colors.length];
  };

  const targetDate = new Date(plan.target_date);
  const isToday = targetDate.toDateString() === new Date().toDateString();
  const isFuture = targetDate > new Date();

  const handleDownloadPDF = () => {
    alert('PDF download feature coming soon!');
  };

  const handleShoppingList = () => {
    alert('Shopping list feature coming soon!');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton 
              onClick={onBack} 
              sx={{ 
                color: '#1e293b',
                bgcolor: 'white',
                border: '1px solid #e2e8f0',
                '&:hover': { 
                  bgcolor: '#f8fafc',
                  borderColor: '#cbd5e1'
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5, color: '#1e293b', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Diet Plan Details
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                {formatDate(targetDate)}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => onDelete(plan._id)}
              sx={{ 
                color: '#ef4444',
                bgcolor: 'white',
                border: '1px solid #fecaca',
                '&:hover': { 
                  bgcolor: '#fef2f2',
                  borderColor: '#fca5a5'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {isToday && (
              <Chip 
                label="Today" 
                size="small"
                sx={{ bgcolor: '#ecfdf5', color: '#10b981', fontWeight: 600, border: '1px solid #d1fae5' }}
              />
            )}
            {isFuture && !isToday && (
              <Chip 
                label="Upcoming" 
                size="small"
                sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}
              />
            )}
            <Chip 
              icon={<PublicIcon sx={{ fontSize: 16 }} />} 
              label={plan.region} 
              size="small"
              sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 600, border: '1px solid #dbeafe' }}
            />
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={3}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            sx={{ 
              color: '#64748b', 
              borderColor: '#e2e8f0',
              bgcolor: 'white',
              '&:hover': { 
                bgcolor: '#f8fafc',
                borderColor: '#cbd5e1'
              }, 
              textTransform: 'none', 
              fontWeight: 600,
              boxShadow: 'none'
            }}
          >
            Download PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={handleShoppingList}
            sx={{ 
              color: '#64748b', 
              borderColor: '#e2e8f0',
              bgcolor: 'white',
              '&:hover': { 
                bgcolor: '#f8fafc',
                borderColor: '#cbd5e1'
              }, 
              textTransform: 'none', 
              fontWeight: 600,
              boxShadow: 'none'
            }}
          >
            Shopping List
          </Button>
        </Stack>

        {/* Nutrition Summary */}
        <Paper elevation={0} sx={{ mb: 3, p: { xs: 2.5, md: 3 }, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#1e293b' }}>
            Nutritional Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  p: 2.5, 
                  textAlign: 'center',
                  bgcolor: '#fff7ed',
                  borderRadius: 2,
                  border: '1px solid #fed7aa'
                }}
              >
                <Typography variant="h4" fontWeight="700" sx={{ color: '#ea580c', mb: 0.5 }}>
                  {actualTotals.calories}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9a3412', fontWeight: 600, fontSize: '0.75rem' }}>
                  kcal
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  p: 2.5, 
                  textAlign: 'center',
                  bgcolor: '#f0fdf4',
                  borderRadius: 2,
                  border: '1px solid #d1fae5'
                }}
              >
                <Typography variant="h4" fontWeight="700" sx={{ color: '#10b981', mb: 0.5 }}>
                  {actualTotals.protein}
                </Typography>
                <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 600, fontSize: '0.75rem' }}>
                  Protein (g)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  p: 2.5, 
                  textAlign: 'center',
                  bgcolor: '#eff6ff',
                  borderRadius: 2,
                  border: '1px solid #dbeafe'
                }}
              >
                <Typography variant="h4" fontWeight="700" sx={{ color: '#3b82f6', mb: 0.5 }}>
                  {actualTotals.carbs}
                </Typography>
                <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600, fontSize: '0.75rem' }}>
                  Carbs (g)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  p: 2.5, 
                  textAlign: 'center',
                  bgcolor: '#fef2f2',
                  borderRadius: 2,
                  border: '1px solid #fecaca'
                }}
              >
                <Typography variant="h4" fontWeight="700" sx={{ color: '#ef4444', mb: 0.5 }}>
                  {actualTotals.fat}
                </Typography>
                <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, fontSize: '0.75rem' }}>
                  Fats (g)
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {actualTotals.fiber > 0 && (
            <Box mt={2.5} textAlign="center">
              <Chip 
                label={`Fiber: ${actualTotals.fiber}g`} 
                sx={{ bgcolor: '#ecfdf5', color: '#10b981', fontWeight: 600, border: '1px solid #d1fae5', fontSize: '0.875rem' }}
              />
            </Box>
          )}
        </Paper>


        {/* Meals */}
        {plan.meals && plan.meals.map((meal, index) => {
          const borderColor = getMealBorderColor(index);
          const isExpanded = expandedMeals[index];
          
          // Calculate meal total from items if not available
          const mealCalories = meal.total_calories || 
            (meal.items && Array.isArray(meal.items) 
              ? meal.items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0)
              : 0);
          
          return (
            <Paper 
              key={index} 
              elevation={0}
              sx={{ 
                mb: 2,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'white',
                border: '1px solid #e2e8f0'
              }}
            >
              {/* Meal Header */}
              <Box 
                sx={{
                  p: 2.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': {
                    bgcolor: '#f8fafc'
                  },
                  transition: 'background-color 0.2s'
                }}
                onClick={() => toggleMeal(index)}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5, color: '#1e293b', fontSize: '1.125rem' }}>
                    {meal.name}
                  </Typography>
                  {meal.timing && (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {meal.timing}
                    </Typography>
                  )}
                </Box>
                <Chip 
                  label={`${Math.round(mealCalories)} kcal`}
                  sx={{ bgcolor: '#f0fdf4', color: '#10b981', fontWeight: 600, border: '1px solid #d1fae5', fontSize: '0.875rem' }}
                />
                <IconButton
                  size="small"
                  sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: '#64748b'
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>

              {/* Collapsible Meal Items */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ p: 2.5, pt: 0, bgcolor: '#fafafa' }}>
                  <Divider sx={{ mb: 2 }} />
                  {meal.items && meal.items.map((item, itemIndex) => (
                    <Box 
                      key={itemIndex} 
                      sx={{ 
                        p: 2.5, 
                        mb: 2, 
                        bgcolor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 1.5,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5, color: '#1e293b' }}>
                          {item.food}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {item.portion}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                        <Chip 
                          label={`${item.calories} kcal`}
                          size="small"
                          sx={{ bgcolor: '#fff7ed', color: '#ea580c', fontWeight: 600, border: '1px solid #fed7aa' }}
                        />
                        <Chip 
                          label={`${item.protein}g protein`}
                          size="small"
                          sx={{ bgcolor: '#f0fdf4', color: '#10b981', fontWeight: 600, border: '1px solid #d1fae5' }}
                        />
                        <Chip 
                          label={`${item.carbs}g carbs`}
                          size="small"
                          sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 600, border: '1px solid #dbeafe' }}
                        />
                        <Chip 
                          label={`${item.fat}g fat`}
                          size="small"
                          sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 600, border: '1px solid #fecaca' }}
                        />
                        {item.fiber > 0 && (
                          <Chip 
                            label={`${item.fiber}g fiber`}
                            size="small"
                            sx={{ bgcolor: '#ecfdf5', color: '#10b981', fontWeight: 600, border: '1px solid #d1fae5' }}
                          />
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Paper>
          );
        })}


        {/* Personalized Tips */}
        {plan.tips && plan.tips.length > 0 && (
          <Paper 
            elevation={0}
            sx={{ 
              mb: 3, 
              p: { xs: 2.5, md: 3 },
              bgcolor: '#fffbeb',
              borderRadius: 2,
              border: '1px solid #fef3c7'
            }}
          >
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#78350f' }}>
              Personalized Tips
            </Typography>
            <Stack spacing={1.5}>
              {plan.tips.map((tip, index) => (
                <Typography 
                  key={index}
                  variant="body2"
                  sx={{ color: '#78350f', lineHeight: 1.6, pl: 2, position: 'relative',
                    '&::before': {
                      content: '"•"',
                      position: 'absolute',
                      left: 0,
                      color: '#f59e0b',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  {tip}
                </Typography>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Sources */}
        {plan.sources && plan.sources.length > 0 && (
          <Paper 
            elevation={0}
            sx={{ 
              mb: 3,
              p: { xs: 2.5, md: 3 },
              bgcolor: 'white',
              borderRadius: 2,
              border: '1px solid #e2e8f0'
            }}
          >
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#1e293b' }}>
              Evidence-Based Guidelines
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {plan.sources.map((source, index) => (
                <Chip
                  key={index}
                  label={`${source.title} (${source.country})`}
                  size="small"
                  sx={{ 
                    bgcolor: '#f0fdf4',
                    color: '#10b981',
                    fontWeight: 600,
                    border: '1px solid #d1fae5'
                  }}
                />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Important Notes */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2.5, md: 3 },
            bgcolor: '#eff6ff',
            borderRadius: 2,
            mb: 3,
            border: '1px solid #dbeafe'
          }}
        >
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#1e40af' }}>
            Important Reminders
          </Typography>
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: '#1e40af', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#3b82f6',
                fontWeight: 'bold'
              }
            }}>
              This plan may adjust based on your glucose readings (when glucose monitoring is enabled)
            </Typography>
            <Typography variant="body2" sx={{ color: '#1e40af', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#3b82f6',
                fontWeight: 'bold'
              }
            }}>
              Drink 8-10 glasses of water throughout the day
            </Typography>
            <Typography variant="body2" sx={{ color: '#1e40af', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#3b82f6',
                fontWeight: 'bold'
              }
            }}>
              Check blood glucose before meals and 2 hours after meals as recommended
            </Typography>
            <Typography variant="body2" sx={{ color: '#1e40af', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#3b82f6',
                fontWeight: 'bold'
              }
            }}>
              Consult your doctor before making major dietary changes
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default DietPlanView;
