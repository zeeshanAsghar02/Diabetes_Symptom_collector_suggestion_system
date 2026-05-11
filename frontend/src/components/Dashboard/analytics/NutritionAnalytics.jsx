import React, { useState } from 'react';
import { Box, Grid, Paper, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer } from 'recharts';
import { alpha } from '@mui/material/styles';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MacronutrientBalanceChart from '../../charts/MacronutrientBalanceChart';
import MealWiseDistributionChart from '../../charts/MealWiseDistributionChart';

export default function NutritionAnalytics({ planUsageAnalytics, macronutrientBalance, mealWiseDistribution }) {
  const [nutritionTimeRange, setNutritionTimeRange] = useState('weekly');

  return (
    <Box sx={{ mt: 0, mb: 4 }}>
      <Box sx={{ 
        mb: 4, 
        pb: 2, 
        borderBottom: (t) => `3px solid ${alpha('#667eea', 0.15)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 56, 
          height: 56, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 8px 16px rgba(102, 126, 234, 0.25)'
        }}>
          <RestaurantIcon sx={{ color: '#fff', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ 
            color: 'text.primary', 
            letterSpacing: -0.5, 
            fontSize: { xs: '1.5rem', md: '1.875rem' },
            mb: 0.5
          }}>
            Nutrition Analytics
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            Track your daily nutritional intake and trends
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 2, md: 2.5 }}>
        {/* Daily Calorie Tracking */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ 
            p: { xs: 2.5, sm: 3, md: 4 }, 
            borderRadius: 4, 
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
            background: (t) => t.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            height: '100%',
            minWidth: { xs: '100%', sm: 550 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            '&:hover': { 
              transform: 'translateY(-6px)', 
              boxShadow: '0 12px 28px rgba(102, 126, 234, 0.15)',
              borderColor: (t) => alpha('#667eea', 0.3)
            } 
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>Calorie Distribution</Typography>
              <ToggleButtonGroup
                value={nutritionTimeRange}
                exclusive
                onChange={(e, newValue) => newValue && setNutritionTimeRange(newValue)}
                size="small"
                sx={{ height: 32 }}
              >
                <ToggleButton value="daily" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}>Daily</ToggleButton>
                <ToggleButton value="weekly" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}>Weekly</ToggleButton>
                <ToggleButton value="monthly" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}>Monthly</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={Array.isArray(planUsageAnalytics?.dailySeries) ? planUsageAnalytics.dailySeries.slice(
                nutritionTimeRange === 'daily' ? -7 : nutritionTimeRange === 'weekly' ? -14 : -30
              ) : []}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="dietCalories" stroke="#10b981" fill="url(#colorCalories)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon fontSize="small" color="success" />
              <Typography variant="caption" color="text.secondary">
                Avg: {planUsageAnalytics?.dailySeries?.length > 0 ? Math.round(planUsageAnalytics.dailySeries.slice(
                  nutritionTimeRange === 'daily' ? -7 : nutritionTimeRange === 'weekly' ? -14 : -30
                ).reduce((sum, d) => sum + (d.dietCalories || 0), 0) / planUsageAnalytics.dailySeries.slice(
                  nutritionTimeRange === 'daily' ? -7 : nutritionTimeRange === 'weekly' ? -14 : -30
                ).length) : 0} kcal/day
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Carbohydrate Tracking */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ 
            p: { xs: 2.5, sm: 3, md: 4 }, 
            borderRadius: 4, 
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
            background: (t) => t.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            height: '100%',
            minWidth: { xs: '100%', sm: 550 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            '&:hover': { 
              transform: 'translateY(-6px)', 
              boxShadow: '0 12px 28px rgba(251, 146, 60, 0.15)',
              borderColor: (t) => alpha('#fb923c', 0.3)
            } 
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>Carbohydrate Trends</Typography>
              <ToggleButtonGroup
                value={nutritionTimeRange}
                exclusive
                onChange={(e, newValue) => newValue && setNutritionTimeRange(newValue)}
                size="small"
                sx={{ height: 32 }}
              >
                <ToggleButton value="daily" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}>Daily</ToggleButton>
                <ToggleButton value="weekly" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}>Weekly</ToggleButton>
                <ToggleButton value="monthly" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}>Monthly</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={Array.isArray(planUsageAnalytics?.dailySeries) ? planUsageAnalytics.dailySeries.slice(
                nutritionTimeRange === 'daily' ? -7 : nutritionTimeRange === 'weekly' ? -14 : -30
              ) : []}>
                <defs>
                  <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="dietCarbs" stroke="#f97316" fill="url(#colorCarbs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon fontSize="small" color="warning" />
              <Typography variant="caption" color="text.secondary">
                Avg: {planUsageAnalytics?.dailySeries?.length > 0 ? Math.round(planUsageAnalytics.dailySeries.slice(
                  nutritionTimeRange === 'daily' ? -7 : nutritionTimeRange === 'weekly' ? -14 : -30
                ).reduce((sum, d) => sum + (d.dietCarbs || 0), 0) / planUsageAnalytics.dailySeries.slice(
                  nutritionTimeRange === 'daily' ? -7 : nutritionTimeRange === 'weekly' ? -14 : -30
                ).length) : 0}g/day
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Macronutrient Distribution */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ 
            p: { xs: 2.5, sm: 3, md: 4 }, 
            borderRadius: 4, 
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
            background: (t) => t.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            height: '100%',
            minHeight: { xs: 'auto', sm: 400 },
            minWidth: { xs: '100%', sm: 550 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            '&:hover': { 
              transform: 'translateY(-6px)', 
              boxShadow: '0 12px 28px rgba(102, 126, 234, 0.15)',
              borderColor: (t) => alpha('#667eea', 0.3)
            } 
          }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>Macronutrient Balance</Typography>
            <MacronutrientBalanceChart balanceData={macronutrientBalance} />
          </Paper>
        </Grid>

        {/* Meal-Wise Distribution */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ 
            p: { xs: 2.5, sm: 3, md: 4 }, 
            borderRadius: 4, 
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
            background: (t) => t.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            height: '100%',
            minHeight: { xs: 'auto', sm: 400 },
            minWidth: { xs: '100%', sm: 550 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            '&:hover': { 
              transform: 'translateY(-6px)', 
              boxShadow: '0 12px 28px rgba(16, 185, 129, 0.15)',
              borderColor: (t) => alpha('#10b981', 0.3)
            } 
          }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>Meal-Wise Distribution (Today)</Typography>
            <MealWiseDistributionChart distributionData={mealWiseDistribution} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
