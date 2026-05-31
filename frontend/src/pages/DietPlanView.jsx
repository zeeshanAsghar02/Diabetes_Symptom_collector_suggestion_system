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

  const targetDate = new Date(plan.target_date);
  const isToday = targetDate.toDateString() === new Date().toDateString();
  const isFuture = targetDate > new Date();

  const handleDownloadPDF = () => {
    alert('PDF download feature coming soon!');
  };

  const handleShoppingList = () => {
    alert('Shopping list feature coming soon!');
  };

  const macroNodes = [
    { label: 'kcal', value: actualTotals.calories, color: '#fb923c' },
    { label: 'Protein (g)', value: actualTotals.protein, color: '#34d399' },
    { label: 'Carbs (g)', value: actualTotals.carbs, color: '#60a5fa' },
    { label: 'Fats (g)', value: actualTotals.fat, color: '#f87171' },
    { label: 'Fiber (g)', value: actualTotals.fiber, color: '#2dd4bf' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0b0f19', py: { xs: 2, md: 4 }, color: '#f8fafc' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={onBack}
              sx={{
                color: 'rgba(226,232,240,0.72)',
                bgcolor: 'rgba(17,24,39,0.76)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.18)'
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="560" sx={{ mb: 0.5, color: '#fff', fontSize: { xs: '1.5rem', md: '2rem' }, letterSpacing: '-0.055em' }}>
                Diet Plan Details
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(203,213,225,0.62)', fontSize: '0.95rem' }}>
                {formatDate(targetDate)}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {isToday && (
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#34d399', boxShadow: '0 0 14px rgba(52,211,153,0.65)' }} />
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 620, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Today
                </Typography>
              </Stack>
            )}
            {isFuture && !isToday && (
              <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.62)', fontWeight: 620, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Upcoming
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={3}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.1)',
              bgcolor: 'rgba(17,24,39,0.76)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.2)'
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
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.1)',
              bgcolor: 'rgba(17,24,39,0.76)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.2)'
              },
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none'
            }}
          >
            Shopping List
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(plan._id)}
            sx={{
              color: 'rgba(226,232,240,0.76)',
              borderColor: 'rgba(255,255,255,0.1)',
              bgcolor: 'rgba(17,24,39,0.76)',
              '&:hover': {
                color: '#ff4d6d',
                bgcolor: 'rgba(255,77,109,0.08)',
                borderColor: 'rgba(255,77,109,0.28)'
              },
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none'
            }}
          >
            Delete Plan
          </Button>
        </Stack>

        {/* Nutrition Summary */}
        <Box sx={{ mb: 3, py: { xs: 2.5, md: 3 } }}>
          <Typography variant="h6" fontWeight="560" sx={{ mb: 3, color: '#fff', letterSpacing: '-0.025em' }}>
            Nutritional Summary
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' },
              gap: { xs: 2, sm: 0 },
            }}
          >
            {macroNodes.map((metric, index) => (
              <Box
                key={metric.label}
                sx={{
                  textAlign: { xs: 'left', sm: 'center' },
                  px: { xs: 0, sm: 2 },
                  borderLeft: { xs: 0, sm: index === 0 ? 0 : '1px solid rgba(255,255,255,0.08)' },
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={360}
                  sx={{
                    color: metric.color,
                    mb: 0.5,
                    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                    textShadow: `0 0 18px ${metric.color}2e`,
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.72)', fontWeight: 650, fontSize: '0.7rem', letterSpacing: '0.11em', textTransform: 'uppercase' }}>
                  {metric.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>


        {/* Meals */}
        {plan.meals && plan.meals.map((meal, index) => {
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
                borderRadius: 1.5,
                overflow: 'hidden',
                bgcolor: 'rgba(17,24,39,0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'none'
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
                    bgcolor: 'rgba(255,255,255,0.03)'
                  },
                  transition: 'background-color 0.25s ease'
                }}
                onClick={() => toggleMeal(index)}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="560" sx={{ mb: 0.5, color: '#fff', fontSize: '1.05rem', letterSpacing: '-0.025em' }}>
                    {meal.name}
                  </Typography>
                  {meal.timing && (
                    <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.62)', fontSize: '0.8rem' }}>
                      {meal.timing}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#67e8f9',
                    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                    fontWeight: 380,
                    fontSize: '0.78rem',
                    textShadow: '0 0 14px rgba(103,232,249,0.18)'
                  }}
                >
                  {Math.round(mealCalories)} kcal
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: 'rgba(226,232,240,0.72)',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' }
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>

              {/* Collapsible Meal Items */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2.5, pb: 1, bgcolor: 'transparent' }}>
                  <Divider sx={{ mb: 0, borderColor: 'rgba(255,255,255,0.05)' }} />
                  {meal.items && meal.items.map((item, itemIndex) => (
                    <Box
                      key={itemIndex}
                      sx={{
                        py: 2,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 1.3fr) minmax(0, 2fr)' },
                        gap: { xs: 1.5, md: 2 },
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        '&:last-child': { borderBottom: 0 },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.015)' }
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={520} sx={{ mb: 0.5, color: '#fff', fontSize: '0.96rem' }}>
                          {item.food}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.58)' }}>
                          {item.portion}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                        {[
                          { label: `${item.calories} kcal`, color: '#fb923c' },
                          { label: `${item.protein}g protein`, color: '#34d399' },
                          { label: `${item.carbs}g carbs`, color: '#60a5fa' },
                          { label: `${item.fat}g fat`, color: '#f87171' },
                        ].map((metric) => (
                          <Typography
                            key={metric.label}
                            variant="caption"
                            sx={{
                              color: metric.color,
                              fontWeight: 520,
                              fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                              letterSpacing: '0.01em'
                            }}
                          >
                            {metric.label}
                          </Typography>
                        ))}
                        {item.fiber > 0 && (
                          <Typography variant="caption" sx={{ color: '#2dd4bf', fontWeight: 520, fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>
                            {item.fiber}g fiber
                          </Typography>
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
              bgcolor: 'rgba(17,24,39,0.45)',
              borderRadius: 1.5,
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <Typography variant="h6" fontWeight="560" sx={{ mb: 2, color: '#fff', letterSpacing: '-0.025em' }}>
              Personalized Tips
            </Typography>
            <Stack spacing={1.5}>
              {plan.tips.map((tip, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{ color: 'rgba(203,213,225,0.68)', lineHeight: 1.6, pl: 2, position: 'relative',
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
              bgcolor: 'rgba(17,24,39,0.45)',
              borderRadius: 1.5,
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <Typography variant="h6" fontWeight="560" sx={{ mb: 2, color: '#fff', letterSpacing: '-0.025em' }}>
              Evidence-Based Guidelines
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {plan.sources.map((source, index) => (
                <Chip
                  key={index}
                  label={`${source.title} (${source.country})`}
                  size="small"
                  sx={{
                    bgcolor: 'transparent',
                    color: '#34d399',
                    fontWeight: 520,
                    border: '1px solid rgba(52,211,153,0.18)'
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
            bgcolor: 'rgba(17,24,39,0.45)',
            borderRadius: 1.5,
            mb: 3,
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <Typography variant="h6" fontWeight="560" sx={{ mb: 2, color: '#fff', letterSpacing: '-0.025em' }}>
            Important Reminders
          </Typography>
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#60a5fa',
                fontWeight: 'bold'
              }
            }}>
              This plan may adjust based on your glucose readings (when glucose monitoring is enabled)
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#60a5fa',
                fontWeight: 'bold'
              }
            }}>
              Drink 8-10 glasses of water throughout the day
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#60a5fa',
                fontWeight: 'bold'
              }
            }}>
              Check blood glucose before meals and 2 hours after meals as recommended
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)', lineHeight: 1.6, pl: 2, position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: 0,
                color: '#60a5fa',
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
