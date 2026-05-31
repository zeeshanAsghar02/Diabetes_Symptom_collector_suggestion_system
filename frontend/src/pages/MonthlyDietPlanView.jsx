// Monthly Diet Plan View - Premium Professional Design
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  Stack,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Collapse,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  LocalFireDepartment as CaloriesIcon,
  FreeBreakfast as BreakfastIcon,
  LunchDining as LunchIcon,
  DinnerDining as DinnerIcon,
  Icecream as SnackIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

// Meal Option Detail Modal - Premium Design
const MealOptionDetailModal = ({ open, onClose, option, mealType }) => {
  if (!option) return null;

  const calculateTotals = () => {
    if (!option.items) return { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 };
    return option.items.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      carbs: acc.carbs + (item.carbs || 0),
      protein: acc.protein + (item.protein || 0),
      fat: acc.fat + (item.fat || 0),
      fiber: acc.fiber + (item.fiber || 0)
    }), { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 });
  };

  const totals = calculateTotals();

  const NutrientBox = ({ label, value, unit, color }) => (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography variant="h5" fontWeight={420} sx={{ color, lineHeight: 1.2, fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>
        {typeof value === 'number' ? Math.round(value) : value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.72)', fontWeight: 500 }}>
        {unit ? `${label} (${unit})` : label}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          bgcolor: '#111827',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 28px 90px rgba(2,6,23,0.62)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: alpha('#10b981', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(16,185,129,0.12)'
            }}
          >
            <RestaurantIcon sx={{ color: '#10b981', fontSize: 22 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={560} sx={{ color: '#fff', letterSpacing: '-0.03em' }}>
              {option.option_name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>
              {mealType}
            </Typography>
          </Box>
          {option.difficulty && (
            <Chip
              label={option.difficulty}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                bgcolor: option.difficulty === 'Easy' ? alpha('#10b981', 0.1) : 
                         option.difficulty === 'Medium' || option.difficulty === 'Moderate' ? alpha('#f59e0b', 0.1) : 
                         alpha('#ef4444', 0.1),
                color: option.difficulty === 'Easy' ? '#10b981' : 
                       option.difficulty === 'Medium' || option.difficulty === 'Moderate' ? '#f59e0b' : '#ef4444'
              }}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Description */}
          {option.description && (
            <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)', lineHeight: 1.6 }}>
              {option.description}
            </Typography>
          )}

          {/* Prep Time */}
          {option.preparation_time && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TimeIcon sx={{ fontSize: 18, color: 'rgba(148,163,184,0.72)' }} />
              <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)' }}>
                Preparation time: <strong>{option.preparation_time}</strong>
              </Typography>
            </Stack>
          )}

          {/* Nutritional Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 1.5,
              border: '1px solid rgba(255,255,255,0.06)',
              bgcolor: 'rgba(15,20,32,0.72)'
            }}
          >
            <Typography variant="subtitle2" fontWeight={560} sx={{ color: '#fff', mb: 2 }}>
              Nutritional Summary
            </Typography>
            <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />}>
              <NutrientBox label="Calories" value={totals.calories} unit="kcal" color="#67e8f9" />
              <NutrientBox label="Carbs" value={totals.carbs.toFixed(1)} unit="g" color="#60a5fa" />
              <NutrientBox label="Protein" value={totals.protein.toFixed(1)} unit="g" color="#10b981" />
              <NutrientBox label="Fat" value={totals.fat.toFixed(1)} unit="g" color="#f87171" />
              <NutrientBox label="Fiber" value={totals.fiber.toFixed(1)} unit="g" color="#a78bfa" />
            </Stack>
          </Paper>

          {/* Food Items Table */}
          <Box>
            <Typography variant="subtitle2" fontWeight={560} sx={{ color: '#fff', mb: 1.5 }}>
              Ingredients & Portions
            </Typography>
            <TableContainer 
              sx={{ bgcolor: 'transparent' }}
            >
              <Table size="small" sx={{ bgcolor: 'transparent' }}>
                <TableHead>
                  <TableRow>
                    {['Food Item', 'Portion', 'Cal', 'Carbs', 'Protein', 'Fat'].map((heading, index) => (
                      <TableCell
                        key={heading}
                        align={index > 1 ? 'right' : 'left'}
                        sx={{ fontWeight: 650, color: 'rgba(148,163,184,0.72)', borderBottom: '1px solid rgba(255,255,255,0.05)', letterSpacing: '0.07em', textTransform: 'uppercase', fontSize: '0.68rem' }}
                      >
                        {heading}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {option.items?.map((item, index) => (
                    <TableRow key={index} sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#fff' }}>
                          {item.food}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>
                          {item.portion}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={380} sx={{ color: '#67e8f9', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>
                          {item.calories}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>{item.carbs}g</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>{item.protein}g</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>{item.fat}g</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'rgba(45,212,191,0.35)',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.7)' }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Meal Category Section Component
const MealCategorySection = ({ category, onViewOption }) => {
  const [expanded, setExpanded] = useState(true);

  const getMealIcon = (mealType) => {
    const icons = {
      'Breakfast': BreakfastIcon,
      'Mid-Morning Snack': SnackIcon,
      'Lunch': LunchIcon,
      'Evening Snack': SnackIcon,
      'Dinner': DinnerIcon
    };
    return icons[mealType] || RestaurantIcon;
  };

  const getMealColor = (mealType) => {
    const colors = {
      'Breakfast': '#f59e0b',
      'Mid-Morning Snack': '#3b82f6',
      'Lunch': '#10b981',
      'Evening Snack': '#8b5cf6',
      'Dinner': '#ef4444'
    };
    return colors[mealType] || '#10b981';
  };

  const color = getMealColor(category.meal_type);
  const Icon = getMealIcon(category.meal_type);

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        border: 0,
        borderRadius: 0,
        overflow: 'visible',
        boxShadow: 'none'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'rgba(22,30,46,0.72)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 1.5,
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          '&:hover': {
            bgcolor: 'rgba(22,30,46,0.92)',
            borderColor: alpha(color, 0.22),
            boxShadow: `0 0 32px ${alpha(color, 0.08)}`
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: alpha(color, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 24px ${alpha(color, 0.12)}`
              }}
            >
              <Icon sx={{ color, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={620} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
                {category.meal_type}
              </Typography>
              {category.timing && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ScheduleIcon sx={{ fontSize: 14, color: 'rgba(148,163,184,0.72)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.64)' }}>
                    {category.timing}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={`${category.target_calories} kcal`}
              size="small"
              sx={{
                bgcolor: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 520,
                color: '#67e8f9',
                fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                '.MuiChip-label': { px: 1.2 }
              }}
            />
            <Chip
              label={`${category.options?.length || 0} options`}
              size="small"
              sx={{
                bgcolor: 'transparent',
                border: `1px solid ${alpha(color, 0.24)}`,
                color,
                fontWeight: 520,
                '.MuiChip-label': { px: 1.2 }
              }}
            />
            <IconButton size="small" sx={{ color: 'rgba(203,213,225,0.58)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' } }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Options Table */}
      <Collapse in={expanded}>
        <TableContainer sx={{ bgcolor: 'transparent', mt: 1.5 }}>
          <Table size="small" sx={{ bgcolor: 'transparent' }}>
            <TableHead>
              <TableRow>
                {['Option', 'Difficulty', 'Calories', 'Items'].map((heading) => (
                  <TableCell
                    key={heading}
                    sx={{
                      fontWeight: 650,
                      color: 'rgba(148,163,184,0.72)',
                      py: 1.35,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem'
                    }}
                  >
                    {heading}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 650, color: 'rgba(148,163,184,0.72)', py: 1.35, width: 80, borderBottom: '1px solid rgba(255,255,255,0.04)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.7rem' }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {category.options?.map((option, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    transition: 'background-color 0.25s ease',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                    '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)' },
                    '&:last-child td': { borderBottom: '1px solid rgba(255,255,255,0.04)' }
                  }}
                >
                  <TableCell sx={{ py: 1.55 }}>
                    <Typography variant="body2" fontWeight={520} sx={{ color: '#fff' }}>
                      {option.option_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.55 }}>
                    {option.difficulty && (
                      <Chip
                        label={option.difficulty}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 520,
                          bgcolor: 'transparent',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: option.difficulty === 'Easy' ? '#10b981' : 
                                 option.difficulty === 'Medium' || option.difficulty === 'Moderate' ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1.55 }}>
                    <Typography variant="body2" fontWeight={380} sx={{ color: '#67e8f9', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', textShadow: '0 0 14px rgba(103,232,249,0.18)' }}>
                      {option.total_calories || Math.round(option.items?.reduce((sum, item) => sum + item.calories, 0) || 0)} kcal
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.55 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>
                      {option.items?.length || 0} items
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.55 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewOption(option, category.meal_type)}
                        sx={{ 
                          color: 'rgba(203,213,225,0.42)',
                          '& svg': { fontSize: 18 },
                          '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' }
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Card>
  );
};

// Main View Component
const MonthlyDietPlanView = ({ plan, onBack, onDelete }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  if (!plan) return null;

  const handleViewOption = (option, mealType) => {
    setSelectedOption(option);
    setSelectedMealType(mealType);
    setDetailModalOpen(true);
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const getTotalOptions = () => {
    if (!plan.meal_categories) return 0;
    return plan.meal_categories.reduce((sum, cat) => sum + (cat.options?.length || 0), 0);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f1420', py: { xs: 2, md: 4 }, color: '#f8fafc' }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
          <Box
            sx={{
              p: 0,
              bgcolor: 'transparent'
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  onClick={onBack}
                  sx={{
                    color: 'rgba(226,232,240,0.72)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Box>
                  <Typography variant="h5" fontWeight={560} sx={{ color: '#fff', letterSpacing: '-0.045em' }}>
                    {getMonthName(plan.month)} {plan.year}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>
                    {getTotalOptions()} meal options across {plan.meal_categories?.length || 0} meal types
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip
                  label={`${plan.total_daily_calories} kcal/day`}
                  size="small"
                  sx={{
                    bgcolor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#67e8f9',
                    fontWeight: 520,
                    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace'
                  }}
                />
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: '#34d399',
                      boxShadow: '0 0 14px rgba(52,211,153,0.65)'
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 620, textTransform: 'capitalize', letterSpacing: '0.06em' }}>
                    {plan.status}
                  </Typography>
                </Stack>
                <Tooltip title="Delete Plan">
                  <IconButton
                    onClick={(e) => onDelete(plan._id, e)}
                    sx={{ 
                      color: 'rgba(203,213,225,0.45)',
                      '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* Meal Categories */}
          {plan.meal_categories?.map((category, index) => (
            <MealCategorySection
              key={index}
              category={category}
              onViewOption={handleViewOption}
            />
          ))}

          {/* Tips Section */}
          {plan.tips && plan.tips.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 1.5,
                border: '1px solid rgba(255,255,255,0.05)',
                bgcolor: 'rgba(17,24,39,0.45)'
              }}
            >
              <Typography variant="subtitle1" fontWeight={560} sx={{ color: '#fff', mb: 2 }}>
                Monthly Tips
              </Typography>
              <Stack spacing={1}>
                {plan.tips.map((tip, index) => (
                  <Stack key={index} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#10b981',
                        mt: 0.8,
                        flexShrink: 0
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.68)', lineHeight: 1.6 }}>
                      {tip}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Sources */}
          {plan.sources && plan.sources.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 1.5,
                border: '1px solid rgba(255,255,255,0.05)',
                bgcolor: 'rgba(17,24,39,0.45)'
              }}
            >
              <Typography variant="subtitle1" fontWeight={560} sx={{ color: '#fff', mb: 2 }}>
                Evidence-Based Guidelines
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {plan.sources.map((source, index) => (
                  <Chip
                    key={index}
                    label={`${source.title} (${source.country})`}
                    size="small"
                    sx={{
                      bgcolor: alpha('#10b981', 0.1),
                      color: '#10b981',
                      fontWeight: 500
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>

      {/* Meal Option Detail Modal */}
      <MealOptionDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        option={selectedOption}
        mealType={selectedMealType}
      />
    </Box>
  );
};

export default MonthlyDietPlanView;
