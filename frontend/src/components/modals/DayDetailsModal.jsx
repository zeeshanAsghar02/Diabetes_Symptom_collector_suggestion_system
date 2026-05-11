import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

export default function DayDetailsModal({ open, dayData, onClose }) {
  if (!dayData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Details for {dayData.label}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Diet Information */}
          {dayData.dietPlan && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <RestaurantIcon color="success" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Diet Plan
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {dayData.dietCalories && (
                  <Chip 
                    label={`${dayData.dietCalories} kcal`} 
                    color="success" 
                    variant="outlined" 
                  />
                )}
                {dayData.dietCarbs && (
                  <Chip 
                    label={`${dayData.dietCarbs}g carbs`} 
                    color="warning" 
                    variant="outlined" 
                  />
                )}
              </Box>
              {dayData.dietPlan.meals && dayData.dietPlan.meals.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Meals:
                  </Typography>
                  {dayData.dietPlan.meals.map((meal, idx) => (
                    <Typography key={idx} variant="body2" color="text.secondary">
                      • {meal.name}: {meal.total_calories || 0} kcal
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {dayData.dietPlan && dayData.exercisePlan && <Divider />}

          {/* Exercise Information */}
          {dayData.exercisePlan && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FitnessCenterIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Exercise Plan
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {dayData.exerciseMinutes && (
                  <Chip 
                    label={`${dayData.exerciseMinutes} min`} 
                    color="primary" 
                    variant="outlined" 
                  />
                )}
                {dayData.exerciseCalories && (
                  <Chip 
                    label={`${dayData.exerciseCalories} kcal burned`} 
                    color="error" 
                    variant="outlined" 
                  />
                )}
              </Box>
              {dayData.exercisePlan.exercises && dayData.exercisePlan.exercises.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Exercises:
                  </Typography>
                  {dayData.exercisePlan.exercises.map((exercise, idx) => (
                    <Typography key={idx} variant="body2" color="text.secondary">
                      • {exercise.name}: {exercise.duration_min || 0} min
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {!dayData.dietPlan && !dayData.exercisePlan && (
            <Typography variant="body2" color="text.secondary">
              No plan data available for this day.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
