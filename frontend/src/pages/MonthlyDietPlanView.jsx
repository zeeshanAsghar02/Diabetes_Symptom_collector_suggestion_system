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
      <Typography variant="h5" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
        {typeof value === 'number' ? Math.round(value) : value}
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
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
          borderRadius: 2,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: alpha('#10b981', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RestaurantIcon sx={{ color: '#10b981', fontSize: 22 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
              {option.option_name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
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
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
              {option.description}
            </Typography>
          )}

          {/* Prep Time */}
          {option.preparation_time && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TimeIcon sx={{ fontSize: 18, color: '#64748b' }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Preparation time: <strong>{option.preparation_time}</strong>
              </Typography>
            </Stack>
          )}

          {/* Nutritional Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: '#e2e8f0',
              bgcolor: '#f8fafc'
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1e293b', mb: 2 }}>
              Nutritional Summary
            </Typography>
            <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
              <NutrientBox label="Calories" value={totals.calories} unit="kcal" color="#ea580c" />
              <NutrientBox label="Carbs" value={totals.carbs.toFixed(1)} unit="g" color="#3b82f6" />
              <NutrientBox label="Protein" value={totals.protein.toFixed(1)} unit="g" color="#10b981" />
              <NutrientBox label="Fat" value={totals.fat.toFixed(1)} unit="g" color="#ef4444" />
              <NutrientBox label="Fiber" value={totals.fiber.toFixed(1)} unit="g" color="#8b5cf6" />
            </Stack>
          </Paper>

          {/* Food Items Table */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1e293b', mb: 1.5 }}>
              Ingredients & Portions
            </Typography>
            <TableContainer 
              component={Paper} 
              elevation={0} 
              sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 1.5 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Food Item</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Portion</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Cal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Carbs</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Protein</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Fat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {option.items?.map((item, index) => (
                    <TableRow key={index} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#1e293b' }}>
                          {item.food}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {item.portion}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#ea580c' }}>
                          {item.calories}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#64748b' }}>{item.carbs}g</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#64748b' }}>{item.protein}g</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#64748b' }}>{item.fat}g</Typography>
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
          variant="contained"
          sx={{
            bgcolor: '#10b981',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#059669' }
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
        border: '1px solid',
        borderColor: '#e2e8f0',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: alpha(color, 0.04),
          borderBottom: '1px solid',
          borderColor: '#e2e8f0',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: alpha(color, 0.08) }
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
                bgcolor: alpha(color, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon sx={{ color, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1e293b' }}>
                {category.meal_type}
              </Typography>
              {category.timing && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ScheduleIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
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
                bgcolor: '#fff',
                border: '1px solid',
                borderColor: '#e2e8f0',
                fontWeight: 600,
                color: '#475569'
              }}
            />
            <Chip
              label={`${category.options?.length || 0} options`}
              size="small"
              sx={{
                bgcolor: alpha(color, 0.1),
                color,
                fontWeight: 600
              }}
            />
            <IconButton size="small" sx={{ color: '#64748b' }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Options Table */}
      <Collapse in={expanded}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Option</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Difficulty</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Calories</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Items</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', py: 1.5, width: 80 }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {category.options?.map((option, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: '#f8fafc' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
                      {option.option_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {option.difficulty && (
                      <Chip
                        label={option.difficulty}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: option.difficulty === 'Easy' ? alpha('#10b981', 0.1) : 
                                   option.difficulty === 'Medium' || option.difficulty === 'Moderate' ? alpha('#f59e0b', 0.1) : 
                                   alpha('#ef4444', 0.1),
                          color: option.difficulty === 'Easy' ? '#10b981' : 
                                 option.difficulty === 'Medium' || option.difficulty === 'Moderate' ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#10b981' }}>
                      {option.total_calories || Math.round(option.items?.reduce((sum, item) => sum + item.calories, 0) || 0)} kcal
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {option.items?.length || 0} items
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewOption(option, category.meal_type)}
                        sx={{ 
                          color: '#64748b',
                          '&:hover': { color: '#10b981', bgcolor: alpha('#10b981', 0.1) }
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
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
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  onClick={onBack}
                  sx={{
                    border: '1px solid',
                    borderColor: '#e2e8f0',
                    '&:hover': { bgcolor: '#f8fafc' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ color: '#1e293b' }}>
                    {getMonthName(plan.month)} {plan.year}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {getTotalOptions()} meal options across {plan.meal_categories?.length || 0} meal types
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip
                  label={plan.region}
                  size="small"
                  sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', fontWeight: 600 }}
                />
                <Chip
                  label={`${plan.total_daily_calories} kcal/day`}
                  size="small"
                  sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontWeight: 600 }}
                />
                <Chip
                  label={plan.status}
                  size="small"
                  sx={{
                    bgcolor: plan.status === 'active' ? alpha('#10b981', 0.1) : '#f1f5f9',
                    color: plan.status === 'active' ? '#10b981' : '#64748b',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                />
                <Tooltip title="Delete Plan">
                  <IconButton
                    onClick={(e) => onDelete(plan._id, e)}
                    sx={{ 
                      color: '#64748b',
                      '&:hover': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.1) }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>

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
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#e2e8f0',
                bgcolor: '#fff'
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1e293b', mb: 2 }}>
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
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
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
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#e2e8f0',
                bgcolor: '#fff'
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1e293b', mb: 2 }}>
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
