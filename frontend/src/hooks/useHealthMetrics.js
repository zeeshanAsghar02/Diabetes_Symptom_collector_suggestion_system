import { useMemo } from 'react';
import { formatDate } from '../utils/dateFormatter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

/**
 * Custom hook for health analytics and metrics calculations
 * Handles BMI, labs, plan usage, macronutrients, and consistency scoring
 */
const useHealthMetrics = ({
  user,
  diseaseData,
  personalInfo,
  medicalInfo,
  dietHistory,
  exerciseHistory,
  lifestyleHistory,
  chartTimeRange,
}) => {
  // Sections configuration based on diagnosis status
  const diagnosedSections = [
    { label: 'Insights', icon: 'InsightsIcon' },
    { label: 'My Account', icon: 'AccountCircleIcon' },
    { label: 'Personalized Suggestions', icon: 'AutoAwesomeIcon' },
    { label: 'Chat Assistant', icon: 'ChatIcon' },
    { label: 'Feedback', icon: 'RateReviewIcon' },
  ];

  const undiagnosedSections = [
    { label: 'Insights', icon: 'InsightsIcon' },
    { label: 'My Account', icon: 'AccountCircleIcon' },
    { label: 'My Disease Data', icon: 'HealingIcon' },
    { label: 'Check My Risk', icon: 'AutoAwesomeIcon' },
    { label: 'Feedback', icon: 'RateReviewIcon' },
  ];

  const sections = user?.diabetes_diagnosed === 'yes' ? diagnosedSections : undiagnosedSections;

  // Completion percentage calculation
  const completionPct = useMemo(() => {
    if (!diseaseData || typeof diseaseData !== 'object') return 0;
    const answered = diseaseData.answeredQuestions || 0;
    const total = diseaseData.totalQuestions || 0;
    if (total === 0) return 0;
    return Math.round((answered / total) * 100);
  }, [diseaseData]);

  // Activity items timeline
  const activityItems = useMemo(() => {
    const items = [];
    
    if (user?.last_assessment_at) {
      items.push({
        title: 'Assessment Completed',
        time: formatDate(user.last_assessment_at),
        icon: 'CheckCircle',
        color: 'success'
      });
    }
    
    if (diseaseData?.lastUpdated) {
      items.push({
        title: 'Disease Data Updated',
        time: formatDate(diseaseData.lastUpdated),
        icon: 'Edit',
        color: 'primary'
      });
    }
    
    if (diseaseData?.disease) {
      items.push({
        title: `Tracking ${diseaseData.disease}`,
        time: 'Active',
        icon: 'Favorite',
        color: 'error'
      });
    }
    
    return items;
  }, [user, diseaseData]);

  // BMI Analytics
  const bmiAnalytics = useMemo(() => {
    if (!personalInfo?.height || !personalInfo?.weight) return null;
    
    const heightM = personalInfo.height / 100;
    const bmi = personalInfo.weight / (heightM * heightM);
    const bmiValue = bmi.toFixed(1);
    
    let label, severity, pct;
    if (bmi < 18.5) {
      label = 'Underweight';
      severity = 'warning';
      pct = Math.min((bmi / 18.5) * 50, 50);
    } else if (bmi < 25) {
      label = 'Normal';
      severity = 'success';
      pct = 50 + ((bmi - 18.5) / (25 - 18.5)) * 25;
    } else if (bmi < 30) {
      label = 'Overweight';
      severity = 'warning';
      pct = 75 + ((bmi - 25) / (30 - 25)) * 15;
    } else {
      label = 'Obese';
      severity = 'error';
      pct = Math.min(90 + ((bmi - 30) / 10) * 10, 100);
    }
    
    return { value: bmiValue, label, severity, pct: Math.round(pct) };
  }, [personalInfo]);

  // Plan Usage Analytics
  const planUsageAnalytics = useMemo(() => {
    const daysToShow = chartTimeRange === '30days' ? 30 : chartTimeRange === '14days' ? 14 : 7;
    
    const today = new Date();
    const timeline = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      timeline.push(date.toISOString().split('T')[0]);
    }

    console.log('Timeline dates:', timeline);
    console.log('Diet history:', dietHistory);
    console.log('Exercise history:', exerciseHistory);

    const dietStats = {
      totalDays: dietHistory.length,
      daysWithPlan: dietHistory.length,
      currentStreak: dietHistory.length > 0 ? Math.min(dietHistory.length, 7) : 0
    };

    const exerciseStats = {
      totalDays: exerciseHistory.length,
      daysWithPlan: exerciseHistory.length,
      currentStreak: exerciseHistory.length > 0 ? Math.min(exerciseHistory.length, 5) : 0
    };

    const lifestyleStats = {
      totalDays: lifestyleHistory.length,
      daysWithPlan: lifestyleHistory.length,
      currentStreak: lifestyleHistory.length > 0 ? Math.min(lifestyleHistory.length, 7) : 0
    };

    const dailySeries = timeline.map((date, idx) => {
      // Try multiple date field names and formats
      const dietPlan = dietHistory.find(d => {
        const planDate = d.date || d.created_at || d.createdAt || d.generatedAt;
        if (!planDate) return false;
        const planDateStr = new Date(planDate).toISOString().split('T')[0];
        return planDateStr === date;
      });
      
      const exercisePlan = exerciseHistory.find(e => {
        const planDate = e.date || e.created_at || e.createdAt || e.generatedAt;
        if (!planDate) return false;
        const planDateStr = new Date(planDate).toISOString().split('T')[0];
        return planDateStr === date;
      });
      
      // If no exact match, use recent data for display (spread across timeline)
      const fallbackDiet = !dietPlan && dietHistory[idx % dietHistory.length];
      const fallbackExercise = !exercisePlan && exerciseHistory[idx % exerciseHistory.length];
      
      const useDiet = dietPlan || fallbackDiet;
      const useExercise = exercisePlan || fallbackExercise;
      
      let dietCalories = 0;
      let dietCarbs = 0;
      if (useDiet?.meals && Array.isArray(useDiet.meals)) {
        useDiet.meals.forEach(meal => {
          // Handle meals with items array (nested structure)
          if (meal.items && Array.isArray(meal.items)) {
            meal.items.forEach(item => {
              const itemCalories = item.calories || item.nutrition?.calories || item.total_calories || 0;
              const itemCarbs = item.carbs || item.carbohydrates || item.nutrition?.carbs || item.nutrition?.carbohydrates || item.total_carbs || 0;
              dietCalories += itemCalories;
              dietCarbs += itemCarbs;
            });
          }
          // Handle direct meal nutrition
          else {
            const mealCalories = meal.calories || meal.nutrition?.calories || meal.total_calories || 0;
            const mealCarbs = meal.carbs || meal.carbohydrates || meal.nutrition?.carbs || meal.nutrition?.carbohydrates || meal.total_carbs || 0;
            dietCalories += mealCalories;
            dietCarbs += mealCarbs;
          }
          
          // Also check meal totals
          if (meal.total_calories && !meal.items) {
            dietCalories += meal.total_calories;
          }
          if (meal.total_carbs && !meal.items) {
            dietCarbs += meal.total_carbs;
          }
        });
      }

      let exerciseMinutes = 0;
      let exerciseCalories = 0;
      
      // Handle new exercise plan structure with sessions
      if (useExercise?.sessions && Array.isArray(useExercise.sessions)) {
        useExercise.sessions.forEach(session => {
          // Add session totals if available
          if (session.total_duration_min) {
            exerciseMinutes += session.total_duration_min;
          }
          if (session.total_estimated_calories) {
            exerciseCalories += session.total_estimated_calories;
          }
          
          // Also check items array within session
          if (session.items && Array.isArray(session.items)) {
            session.items.forEach(item => {
              if (!session.total_duration_min) {
                exerciseMinutes += item.duration_min || item.duration || 0;
              }
              if (!session.total_estimated_calories) {
                exerciseCalories += item.estimated_calories || item.calories_burned || item.calories || 0;
              }
            });
          }
        });
      }
      // Fallback to old structure with exercises array
      else if (useExercise?.exercises && Array.isArray(useExercise.exercises)) {
        useExercise.exercises.forEach(ex => {
          exerciseMinutes += ex.duration || ex.duration_minutes || 0;
          exerciseCalories += ex.calories_burned || ex.caloriesBurned || ex.calories || 0;
        });
      }
      // Use totals if available
      else if (useExercise?.totals) {
        exerciseMinutes = useExercise.totals.duration_total_min || 0;
        exerciseCalories = useExercise.totals.calories_total || 0;
      }

      return {
        key: date,
        label: formatDate(date, 'DD MMMM'),
        dietCalories,
        dietCarbs,
        exerciseMinutes,
        exerciseCalories,
        dietPlan: !!useDiet,
        exercisePlan: !!useExercise
      };
    });

    console.log('Daily Series Generated:', dailySeries);
    console.log('Sample values:', dailySeries.map(d => ({
      label: d.label,
      dietCalories: d.dietCalories,
      exerciseMinutes: d.exerciseMinutes
    })));

    const avgDietCalories = dailySeries.reduce((sum, d) => sum + d.dietCalories, 0) / dailySeries.length || 0;
    const avgDietCarbs = dailySeries.reduce((sum, d) => sum + d.dietCarbs, 0) / dailySeries.length || 0;
    const avgExerciseMinutes = dailySeries.reduce((sum, d) => sum + d.exerciseMinutes, 0) / dailySeries.length || 0;
    const avgExerciseCalories = dailySeries.reduce((sum, d) => sum + d.exerciseCalories, 0) / dailySeries.length || 0;

    return {
      timeline,
      dietStats,
      exerciseStats,
      lifestyleStats,
      dailySeries,
      avgDietCalories: Math.round(avgDietCalories),
      avgDietCarbs: Math.round(avgDietCarbs),
      avgExerciseMinutes: Math.round(avgExerciseMinutes),
      avgExerciseCalories: Math.round(avgExerciseCalories)
    };
  }, [dietHistory, exerciseHistory, lifestyleHistory, chartTimeRange]);

  // Macronutrient Balance
  const macronutrientBalance = useMemo(() => {
    console.log('Diet history for macros:', dietHistory);
    if (dietHistory.length > 0) {
      console.log('First diet plan structure:', dietHistory[0]);
      console.log('First diet plan meals:', dietHistory[0]?.meals);
    }
    
    const last7Days = dietHistory.slice(-7);
    let totalCarbs = 0, totalProtein = 0, totalFat = 0, totalFiber = 0;
    
    last7Days.forEach(day => {
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach(meal => {
          // Handle meals with items array (nested structure)
          if (meal.items && Array.isArray(meal.items)) {
            meal.items.forEach(item => {
              const carbs = item.carbs || item.carbohydrates || item.nutrition?.carbs || item.nutrition?.carbohydrates || 0;
              const protein = item.protein || item.proteins || item.nutrition?.protein || item.nutrition?.proteins || 0;
              const fat = item.fat || item.fats || item.nutrition?.fat || item.nutrition?.fats || 0;
              const fiber = item.fiber || item.nutrition?.fiber || 0;
              
              totalCarbs += carbs;
              totalProtein += protein;
              totalFat += fat;
              totalFiber += fiber;
            });
          }
          // Handle direct meal nutrition
          else {
            const carbs = meal.carbs || meal.carbohydrates || meal.nutrition?.carbs || meal.nutrition?.carbohydrates || meal.total_carbs || 0;
            const protein = meal.protein || meal.proteins || meal.nutrition?.protein || meal.nutrition?.proteins || meal.total_protein || 0;
            const fat = meal.fat || meal.fats || meal.nutrition?.fat || meal.nutrition?.fats || meal.total_fat || 0;
            const fiber = meal.fiber || meal.nutrition?.fiber || meal.total_fiber || 0;
            
            totalCarbs += carbs;
            totalProtein += protein;
            totalFat += fat;
            totalFiber += fiber;
          }
        });
      }
    });

    console.log('Macro totals:', { totalCarbs, totalProtein, totalFat, totalFiber });

    const total = totalCarbs + totalProtein + totalFat;
    if (total === 0) {
      return { carbs: 50, protein: 25, fat: 20, fiber: 5 };
    }

    return {
      carbs: Math.round((totalCarbs / total) * 100),
      protein: Math.round((totalProtein / total) * 100),
      fat: Math.round((totalFat / total) * 100),
      fiber: Math.round(totalFiber / 10)
    };
  }, [dietHistory]);

  // Meal-wise Distribution
  const mealWiseDistribution = useMemo(() => {
    const todayOrLatest = dietHistory[dietHistory.length - 1];
    console.log('Latest diet plan for meal distribution:', todayOrLatest);
    
    if (!todayOrLatest?.meals) return [];

    const mealMap = {
      'breakfast': { meal: 'Breakfast', calories: 0, protein: 0 },
      'lunch': { meal: 'Lunch', calories: 0, protein: 0 },
      'snack': { meal: 'Snacks', calories: 0, protein: 0 },
      'snacks': { meal: 'Snacks', calories: 0, protein: 0 },
      'dinner': { meal: 'Dinner', calories: 0, protein: 0 }
    };

    todayOrLatest.meals.forEach(m => {
      console.log('Processing meal:', m);
      const type = (m.meal_type || m.type || m.name || 'snack').toLowerCase();
      
      let calories = 0;
      let protein = 0;
      
      // Handle meals with items array (nested structure)
      if (m.items && Array.isArray(m.items)) {
        m.items.forEach(item => {
          calories += item.calories || item.nutrition?.calories || item.total_calories || 0;
          protein += item.protein || item.proteins || item.nutrition?.protein || item.nutrition?.proteins || item.total_protein || 0;
        });
      }
      // Handle direct meal nutrition
      else {
        calories = m.calories || m.nutrition?.calories || m.total_calories || 0;
        protein = m.protein || m.proteins || m.nutrition?.protein || m.nutrition?.proteins || m.total_protein || 0;
      }
      
      if (mealMap[type]) {
        mealMap[type].calories += calories;
        mealMap[type].protein += protein;
      } else {
        // If type doesn't match, add to snacks
        mealMap['snack'].calories += calories;
        mealMap['snack'].protein += protein;
      }
    });

    const result = Object.values(mealMap).filter(m => m.calories > 0);
    console.log('Meal-wise distribution result:', result);
    return result;
  }, [dietHistory]);

  // Consistency Score
  const consistencyScore = useMemo(() => {
    const dietAdherence = planUsageAnalytics.dietStats.daysWithPlan / Math.max(planUsageAnalytics.dietStats.totalDays, 1);
    const exerciseAdherence = planUsageAnalytics.exerciseStats.daysWithPlan / Math.max(planUsageAnalytics.exerciseStats.totalDays, 1);
    return Math.round(((dietAdherence + exerciseAdherence) / 2) * 100);
  }, [planUsageAnalytics]);

  // Consistency Badge
  const consistencyBadge = useMemo(() => {
    if (consistencyScore >= 90) return { label: 'Diamond', color: '#b9f2ff', icon: '??' };
    if (consistencyScore >= 75) return { label: 'Gold', color: '#ffd700', icon: '??' };
    if (consistencyScore >= 50) return { label: 'Silver', color: '#c0c0c0', icon: '??' };
    return { label: 'Bronze', color: '#cd7f32', icon: '??' };
  }, [consistencyScore]);

  return {
    sections,
    completionPct,
    activityItems,
    bmiAnalytics,
    planUsageAnalytics,
    macronutrientBalance,
    mealWiseDistribution,
    consistencyScore,
    consistencyBadge,
  };
};

export default useHealthMetrics;
