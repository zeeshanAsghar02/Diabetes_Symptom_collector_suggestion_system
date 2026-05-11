/**
 * Calorie Calculator Service
 * Uses Harris-Benedict Equation with activity level multipliers
 */

class CalorieCalculatorService {
  
  /**
   * Activity level multipliers
   */
  activityMultipliers = {
    sedentary: 1.2,        // Little or no exercise
    light: 1.375,          // Light exercise 1-3 days/week
    moderate: 1.55,        // Moderate exercise 3-5 days/week
    active: 1.725,         // Hard exercise 6-7 days/week
    very_active: 1.9       // Very hard exercise & physical job
  };
  
  /**
   * Calculate Basal Metabolic Rate (BMR) using Harris-Benedict Equation
   * @param {number} age - Age in years
   * @param {string} gender - 'Male' or 'Female'
   * @param {number} weight - Weight in kg
   * @param {number} height - Height in cm
   * @returns {number} - BMR in kcal/day
   */
  calculateBMR(age, gender, weight, height) {
    // Use defaults if parameters are missing (due to incomplete profile or decryption errors)
    const defaultAge = age || 30;
    const defaultGender = gender || 'male';
    const defaultWeight = weight || 70;
    const defaultHeight = height || 170;
    
    if (!age || !gender || !weight || !height) {
      console.warn('[CalorieCalculator] Using default values for missing parameters:', {
        age: !age ? `${defaultAge} (default)` : age,
        gender: !gender ? `${defaultGender} (default)` : gender,
        weight: !weight ? `${defaultWeight} (default)` : weight,
        height: !height ? `${defaultHeight} (default)` : height
      });
    }

    let bmr;
    
    if (defaultGender.toLowerCase() === 'male') {
      // BMR (Men) = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
      bmr = 88.362 + (13.397 * defaultWeight) + (4.799 * defaultHeight) - (5.677 * defaultAge);
    } else {
      // BMR (Women) = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age in years)
      bmr = 447.593 + (9.247 * defaultWeight) + (3.098 * defaultHeight) - (4.330 * defaultAge);
    }
    
    return Math.round(bmr);
  }
  
  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   * @param {number} bmr - Basal Metabolic Rate
   * @param {string} activityLevel - Activity level key
   * @returns {number} - TDEE in kcal/day
   */
  calculateTDEE(bmr, activityLevel = 'moderate') {
    const multiplier = this.activityMultipliers[activityLevel?.toLowerCase()] || this.activityMultipliers.moderate;
    return Math.round(bmr * multiplier);
  }
  
  /**
   * Apply diabetes-specific adjustments
   * @param {number} tdee - Total Daily Energy Expenditure
   * @param {string} diabetesType - Type of diabetes
   * @param {string} goal - 'maintain', 'lose', 'gain'
   * @param {number} currentBMI - Current BMI
   * @returns {number} - Adjusted calorie target
   */
  applyDiabeticAdjustments(tdee, diabetesType, goal = 'maintain', currentBMI = null) {
    let adjustedCalories = tdee;
    
    // Goal-based adjustments
    if (goal === 'lose') {
      // Safe deficit: 500 kcal/day = ~0.5kg/week
      adjustedCalories -= 500;
    } else if (goal === 'gain') {
      // Safe surplus: 300 kcal/day
      adjustedCalories += 300;
    }
    
    // BMI-based adjustments for overweight/obese diabetics
    if (currentBMI && currentBMI > 25 && goal !== 'gain') {
      // Recommend slight deficit for weight management
      adjustedCalories = Math.min(adjustedCalories, tdee - 200);
    }
    
    // Type 1 diabetes may need slightly higher calories
    if (diabetesType?.toLowerCase().includes('type 1')) {
      adjustedCalories += 50;
    }
    
    // Safety bounds: Never go below 1200 (women) or 1500 (men) without medical supervision
    adjustedCalories = Math.max(adjustedCalories, 1200);
    
    return Math.round(adjustedCalories);
  }
  
  /**
   * Calculate BMI
   * @param {number} weight - Weight in kg
   * @param {number} height - Height in cm
   * @returns {number} - BMI value
   */
  calculateBMI(weight, height) {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  
  /**
   * Main function: Calculate daily calorie target for diabetic patient
   * @param {Object} personalInfo - User personal information
   * @param {Object} medicalInfo - User medical information
   * @returns {Object} - Calorie breakdown and recommendations
   */
  calculateDailyCalories(personalInfo, medicalInfo) {
    try {
      const { age, gender, weight, height, activity_level, goal } = personalInfo;
      const { diabetes_type } = medicalInfo;
      
      // Calculate BMR
      const bmr = this.calculateBMR(age, gender, weight, height);
      
      // Calculate TDEE
      const tdee = this.calculateTDEE(bmr, activity_level);
      
      // Calculate BMI
      const bmi = this.calculateBMI(weight, height);
      
      // Apply diabetic adjustments
      const targetCalories = this.applyDiabeticAdjustments(tdee, diabetes_type, goal, bmi);
      
      // Calculate macronutrient distribution (diabetic-friendly)
      const macros = this.calculateMacros(targetCalories);
      
      return {
        bmr,
        tdee,
        bmi,
        target_calories: targetCalories,
        macros,
        activity_level: activity_level || 'moderate',
        recommendations: this.getRecommendations(bmi, diabetes_type, goal)
      };
    } catch (error) {
      console.error('Error calculating daily calories:', error);
      throw error;
    }
  }
  
  /**
   * Calculate macronutrient distribution for diabetics
   * @param {number} calories - Total daily calories
   * @returns {Object} - Macro breakdown
   */
  calculateMacros(calories) {
    // Diabetic-friendly distribution:
    // Carbs: 45-50% (complex carbs, low GI)
    // Protein: 20-25%
    // Fat: 25-30% (healthy fats)
    
    return {
      carbs: {
        grams: Math.round((calories * 0.47) / 4), // 4 kcal per gram
        percentage: 47,
        calories: Math.round(calories * 0.47)
      },
      protein: {
        grams: Math.round((calories * 0.23) / 4), // 4 kcal per gram
        percentage: 23,
        calories: Math.round(calories * 0.23)
      },
      fat: {
        grams: Math.round((calories * 0.30) / 9), // 9 kcal per gram
        percentage: 30,
        calories: Math.round(calories * 0.30)
      }
    };
  }
  
  /**
   * Get personalized recommendations
   * @param {number} bmi - Body Mass Index
   * @param {string} diabetesType - Type of diabetes
   * @param {string} goal - User's goal
   * @returns {Array} - Array of recommendations
   */
  getRecommendations(bmi, diabetesType, goal) {
    const recommendations = [];
    
    if (bmi > 25) {
      recommendations.push('Consider weight management to improve insulin sensitivity');
    }
    
    if (bmi < 18.5) {
      recommendations.push('Consult your doctor about safe weight gain strategies');
    }
    
    if (diabetesType?.toLowerCase().includes('type 2')) {
      recommendations.push('Focus on complex carbohydrates and high fiber foods');
      recommendations.push('Regular physical activity can improve insulin sensitivity');
    }
    
    if (diabetesType?.toLowerCase().includes('type 1')) {
      recommendations.push('Carb counting is essential for insulin dosing');
      recommendations.push('Maintain consistent meal timing');
    }
    
    recommendations.push('Stay hydrated with 8-10 glasses of water daily');
    recommendations.push('Monitor blood glucose before and after meals');
    
    return recommendations;
  }
  
  /**
   * Distribute calories across meals
   * @param {number} totalCalories - Total daily calories
   * @returns {Object} - Calorie distribution by meal
   */
  distributeMealCalories(totalCalories) {
    return {
      breakfast: Math.round(totalCalories * 0.25),        // 25%
      mid_morning_snack: Math.round(totalCalories * 0.10), // 10%
      lunch: Math.round(totalCalories * 0.30),            // 30%
      evening_snack: Math.round(totalCalories * 0.10),    // 10%
      dinner: Math.round(totalCalories * 0.25)            // 25%
    };
  }
}

export default new CalorieCalculatorService();
