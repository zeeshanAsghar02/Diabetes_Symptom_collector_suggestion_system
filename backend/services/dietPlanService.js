import DietPlan from '../models/DietPlan.js';
import { User } from '../models/User.js';
import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import calorieCalculatorService from './calorieCalculatorService.js';
import regionDiscoveryService from './regionDiscoveryService.js';
import { processQuery } from './queryService.js';
import axios from 'axios';

class DietPlanService {
  
  /**
   * Main generation function - works for ANY region dynamically
   * @param {string} userId - User ID
   * @param {string} targetDate - Target date for plan (YYYY-MM-DD)
   * @returns {Promise<Object>} - Generated diet plan
   */
  async generateDietPlan(userId, targetDate) {
    try {
      // 1. Get user profile and personal info
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      const personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
      const medicalInfo = await UserMedicalInfo.findOne({ user_id: userId });

      if (!personalInfo) {
        throw new Error('Personal information not found. Please complete your profile first.');
      }

      // Calculate age from date of birth
      const dob = new Date(personalInfo.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      const personal = {
        age,
        gender: personalInfo.gender,
        weight: personalInfo.weight,
        height: personalInfo.height,
        activity_level: personalInfo.activity_level || 'Sedentary',
        goal: 'maintain',
        country: user.country || 'Global'
      };

      const medical = {
        diabetes_type: medicalInfo?.diabetes_type || 'Type 2',
        medications: medicalInfo?.medications || []
      };
      
      // 2. Check if plan already exists for this date
      const targetDateObj = new Date(targetDate);
      targetDateObj.setHours(0, 0, 0, 0);
      
      const existingPlan = await DietPlan.findOne({
        user_id: userId,
        target_date: targetDateObj
      });
      
      if (existingPlan) {
        throw new Error('Diet plan already exists for this date. View your existing plan or choose a different date.');
      }
      
      // 3. Discover region capability (DYNAMIC - no hardcoding)
      let userRegion = personal.country;
      const regionCoverage = await regionDiscoveryService.checkRegionCoverage(userRegion, 'diet_chart');
      
      if (!regionCoverage.canGeneratePlan) {
        // Try fallback to global documents
        const fallbackRegion = await regionDiscoveryService.getFallbackRegion(userRegion, 'diet');
        if (fallbackRegion) {
          userRegion = fallbackRegion;
          console.log(`Using fallback region: ${fallbackRegion} for user from ${personal.country}`);
        } else {
          console.log(`⚠️ No dietary documents for ${userRegion}, AI will use built-in knowledge`);
        }
      }
      
      // 4. Calculate calorie needs
      const calorieData = calorieCalculatorService.calculateDailyCalories(personal, medical);
      const dailyCalories = calorieData.target_calories;
      const mealDistribution = calorieCalculatorService.distributeMealCalories(dailyCalories);
      
      // 5. Get previous 3 days of diet plans for variety
      const threeDaysAgo = new Date(targetDateObj);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const previousPlans = await DietPlan.find({
        user_id: userId,
        target_date: { $gte: threeDaysAgo, $lt: targetDateObj }
      })
      .sort({ target_date: -1 })
      .limit(3);
      
      // 6. Query RAG for regional food data (empty results OK - AI will use built-in knowledge)
      const foodContext = await this.queryRegionalFoods(userRegion, dailyCalories, previousPlans);
      console.log(`📚 RAG context: ${foodContext.chunks?.length || 0} chunks retrieved`);
      
      // 7. Build AI prompt for Diabetica-7B
      const aiPrompt = this.buildDietPrompt(
        personal,
        medical,
        dailyCalories,
        mealDistribution,
        foodContext,
        previousPlans,
        targetDateObj
      );
      
      // 8. Call Diabetica-7B for meal generation (NO FALLBACK - direct AI response required)
      console.log('🤖 Calling AI model - no fallback mode');
      const aiResponse = await this.callDiabetica(aiPrompt);
      
      // Log raw response for debugging (truncated)
      console.log('📥 AI Response preview:', aiResponse.substring(0, 500) + '...');
      
      // 9. Parse and structure meal plan
      const structuredPlan = this.parseMealPlan(aiResponse, dailyCalories, mealDistribution);
      
      // Validate final structure before saving
      if (!structuredPlan.meals || structuredPlan.meals.length === 0) {
        console.error('❌ Validation failed: No valid meals in structured plan');
        console.error('Raw AI response:', aiResponse);
        throw new Error('Failed to generate valid meal plan. AI response did not contain properly structured meals.');
      }
      
      console.log(`✅ Successfully validated ${structuredPlan.meals.length} meals`);
      
      // 10. Save to database
      const dietPlan = new DietPlan({
        user_id: userId,
        target_date: targetDateObj,
        region: userRegion,
        total_calories: structuredPlan.nutritional_totals.calories || dailyCalories,
        meals: structuredPlan.meals,
        nutritional_totals: structuredPlan.nutritional_totals,
        sources: foodContext.sources,
        tips: structuredPlan.tips || [],
        status: 'pending',
        generated_at: new Date()
      });
      
      await dietPlan.save();
      
      return {
        success: true,
        plan: dietPlan,
        calorie_data: calorieData,
        region_coverage: regionCoverage
      };
      
    } catch (error) {
      console.error('Error generating diet plan:', error);
      throw error;
    }
  }
  
  /**
   * Query ChromaDB for regional food composition data (DYNAMIC)
   * @param {string} region - Region/country name
   * @param {number} calorieTarget - Daily calorie target
   * @param {Array} previousPlans - Previous diet plans
   * @returns {Promise<Object>} - Food context with chunks and sources
   */
  async queryRegionalFoods(region, calorieTarget, previousPlans) {
    try {
      // Build MORE diverse queries for better variety in RAG retrieval
      const queries = [
        `${region} food composition nutritional values calories carbohydrates protein diabetic`,
        `${region} meal planning breakfast lunch dinner traditional foods diabetes`,
        `${region} glycemic index portion sizes exchange list diabetic diet`,
        `diabetic food portions calorie content ${region} cuisine nutrition facts`,
        `${region} healthy recipes diabetes management meal ideas`,
        `${region} snacks appetizers diabetic friendly low glycemic index`,
        `${region} protein sources vegetables fruits diabetes nutrition`,
        `${region} cooking methods food preparation diabetes guidelines`
      ];
      
      // Extract foods from previous plans to AVOID repetition
      const previousFoods = this.extractPreviousFoods(previousPlans);
      
      console.log(`🚫 Avoiding ${previousFoods.length} foods from previous plans`);
      
      const allResults = [];
      const seenTexts = new Set();
      
      // Query with region-specific filter (DYNAMIC) - Include both diet_chart and guideline documents
      // Use flat $in filter to avoid nested $and/$or complexity in qdrantService formatFilter
      const filter = {
        country: region,
        doc_type: { $in: ['diet_chart', 'guideline'] }
      };
      
      const collectResults = async (activeFilter) => {
        for (const query of queries) {
          try {
            const queryResponse = await processQuery(
              query,
              {
                topK: 8,
                filter: activeFilter,
                minScore: 0.0
              }
            );
            const results = queryResponse.results || [];
            results.forEach(result => {
              const textKey = result.text.substring(0, 100);
              if (!seenTexts.has(textKey)) {
                seenTexts.add(textKey);
                allResults.push(result);
              }
            });
          } catch (error) {
            console.warn(`Query failed for: ${query}`, error.message);
          }
        }
      };

      // Attempt 1: region + doc_type filter
      await collectResults(filter);

      // Attempt 2: doc_type only (in case country field mismatch in Qdrant)
      if (allResults.length === 0) {
        console.warn(`⚠️  No results for region "${region}" — retrying with doc_type filter only`);
        seenTexts.clear();
        await collectResults({ doc_type: { $in: ['diet_chart', 'guideline'] } });
      }

      // Attempt 3: no filter at all (last resort)
      if (allResults.length === 0) {
        console.warn(`⚠️  No results with doc_type filter — retrying with no filter`);
        seenTexts.clear();
        await collectResults(null);
      }

      // Return whatever we got (even empty) - LLM will use built-in knowledge
      console.log(`📥 Retrieved ${allResults.length} dietary context chunks`);
      
      // Format chunks and extract sources
      return {
        chunks: allResults.map(r => r.text),
        sources: this.extractSources(allResults),
        avoidFoods: previousFoods
      };
      
    } catch (error) {
      console.error('❌ Error querying regional foods:', error);
      // Return empty context instead of throwing - let AI use built-in knowledge
      return { chunks: [], sources: [], avoidFoods: previousFoods || [] };
    }
  }
  
  /**
   * Extract foods from previous plans to avoid repetition
   * @param {Array} previousPlans - Previous diet plans
   * @returns {Array} - List of food items to avoid
   */
  extractPreviousFoods(previousPlans) {
    const foods = new Set();
    
    previousPlans.forEach(plan => {
      plan.meals?.forEach(meal => {
        meal.items?.forEach(item => {
          if (item.food) {
            foods.add(item.food.toLowerCase());
          }
        });
      });
    });
    
    return Array.from(foods);
  }
  
  /**
   * Extract source documents from query results
   * @param {Array} results - Query results
   * @returns {Array} - Unique sources
   */
  extractSources(results) {
    const sourcesMap = new Map();
    
    results.forEach(result => {
      // Updated to match the new queryService result structure
      const metadata = result.chunk_metadata || result.metadata;
      
      if (metadata?.title) {
        const key = metadata.title;
        if (!sourcesMap.has(key)) {
          sourcesMap.set(key, {
            title: metadata.title,
            country: metadata.country || 'Unknown',
            doc_type: metadata.doc_type || 'diet'
          });
        }
      }
    });
    
    return Array.from(sourcesMap.values());
  }
  
  /**
   * Format previous meals for prompt context
   * @param {Array} previousPlans - Previous diet plans
   * @returns {string} - Formatted meal history
   */
  formatPreviousMeals(previousPlans) {
    if (!previousPlans || previousPlans.length === 0) {
      return 'No previous meal history available.';
    }
    
    let formatted = '';
    previousPlans.forEach((plan, index) => {
      const date = new Date(plan.target_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      formatted += `\n${date}:\n`;
      
      plan.meals?.forEach(meal => {
        formatted += `  ${meal.name}: ${meal.items?.map(i => i.food).join(', ')}\n`;
      });
    });
    
    return formatted;
  }
  
  /**
   * Build prompt for Diabetica-7B (DYNAMIC for all regions)
   * @param {Object} personal - Personal info
   * @param {Object} medical - Medical info
   * @param {number} calories - Daily calorie target
   * @param {Object} mealDistribution - Calorie distribution by meal
   * @param {Object} foodContext - RAG retrieved food context
   * @param {Array} previousPlans - Previous diet plans
   * @param {Date} targetDate - Target date
   * @returns {string} - Complete AI prompt
   */
  buildDietPrompt(personal, medical, calories, mealDistribution, foodContext, previousPlans, targetDate) {
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    return `You are an expert diabetes dietitian creating a personalized meal plan based on evidence-based dietary guidelines.

PATIENT PROFILE:
- Age: ${personal.age} years
- Gender: ${personal.gender}
- Weight: ${personal.weight}kg, Height: ${personal.height}cm
- Region: ${personal.country}
- Diabetes Type: ${medical.diabetes_type}
- Medications: ${medical.medications?.join(', ') || 'None specified'}
- Activity Level: ${personal.activity_level}
- Daily Calorie Target: ${calories} kcal

MEAL CALORIE DISTRIBUTION:
- Breakfast: ${mealDistribution.breakfast} kcal (25%)
- Mid-Morning Snack: ${mealDistribution.mid_morning_snack} kcal (10%)
- Lunch: ${mealDistribution.lunch} kcal (30%)
- Evening Snack: ${mealDistribution.evening_snack} kcal (10%)
- Dinner: ${mealDistribution.dinner} kcal (25%)

TARGET DATE: ${dayName}

REGIONAL DIETARY GUIDELINES AND FOOD DATABASE (${personal.country}):
${foodContext.chunks && foodContext.chunks.length > 0 
  ? foodContext.chunks.slice(0, 8).map((chunk, i) => `[Source ${i + 1}]\n${chunk.substring(0, 400)}${chunk.length > 400 ? '...' : ''}`).join('\n\n---\n\n')
  : 'No regional documents available - use your built-in nutrition knowledge for diabetes patients in ' + personal.country + '. Focus on locally available foods typical for this region.'}

${previousPlans.length > 0 ? `PREVIOUS MEAL HISTORY (for variety - DO NOT repeat these exact combinations):
${this.formatPreviousMeals(previousPlans)}` : 'This is the first diet plan for this user.'}

${foodContext.avoidFoods.length > 0 ? `\nIMPORTANT: Provide variety by avoiding recent foods: ${foodContext.avoidFoods.slice(0, 15).join(', ')}` : ''}

CRITICAL INSTRUCTIONS:
1. Create exactly 5 meals: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
2. Use ONLY foods mentioned in the Regional Dietary Guidelines above
3. Match the calorie targets: Breakfast ${mealDistribution.breakfast}kcal, Mid-Morning Snack ${mealDistribution.mid_morning_snack}kcal, Lunch ${mealDistribution.lunch}kcal, Evening Snack ${mealDistribution.evening_snack}kcal, Dinner ${mealDistribution.dinner}kcal
4. Total calories must equal ${calories} kcal (±50 kcal acceptable)
5. Include exact portions from the guidelines (e.g., "1 cup", "150g", "2 medium")
6. Provide nutritional breakdown per food item (calories, carbs, protein, fat, fiber)
7. **VARIETY IS MANDATORY** - Each meal plan MUST be different from previous days
8. **STRICT FOOD AVOIDANCE** - DO NOT use any foods listed in previous meal history
9. Follow diabetic principles: low GI foods, high fiber (35g+ daily), balanced macros
10. Include traditional ${personal.country} foods when mentioned in guidelines
11. Add specific timing for each meal (e.g., "7:00 AM - 9:00 AM")
12. Generate 3-5 personalized tips based on the patient profile
13. **CREATE UNIQUE COMBINATIONS** - Mix different food items creatively within guidelines
14. **NO REPETITION** - If this is Day 2+, ensure completely different meal structure

RESPONSE FORMAT (STRICT JSON - NO MARKDOWN, NO TEXT OUTSIDE JSON):

CRITICAL JSON RULES:
- "meals" MUST be an array of exactly 5 meal objects
- Each meal MUST have "name", "timing", and "items" fields
- "items" MUST be an array of food objects (NEVER a string or text)
- Each item MUST have ALL required fields: "food" (string), "portion" (string), "calories" (number), "carbs" (number), "protein" (number), "fat" (number), "fiber" (number)
- DO NOT include general advice, tips, or notes as meal items
- DO NOT add text-only meals like "Monitor blood glucose" - these should go in "tips" array only
- "tips" MUST be an array of strings (NOT part of meals)

EXAMPLE (follow this structure exactly):
{
  "meals": [
    {
      "name": "Breakfast",
      "timing": "7:00 AM - 9:00 AM",
      "items": [
        {
          "food": "Whole Wheat Paratha",
          "portion": "1 medium (6 inch)",
          "calories": 120,
          "carbs": 20,
          "protein": 3,
          "fat": 3,
          "fiber": 2
        },
        {
          "food": "Greek Yogurt",
          "portion": "1 cup (200g)",
          "calories": 100,
          "carbs": 8,
          "protein": 17,
          "fat": 2,
          "fiber": 0
        }
      ],
      "total_calories": 220
    }
  ],
  "nutritional_totals": {
    "calories": ${calories},
    "carbs": 210,
    "protein": 90,
    "fat": 65,
    "fiber": 38
  },
  "tips": [
    "Check blood glucose before breakfast and 2 hours after meals",
    "Drink 8-10 glasses of water throughout the day",
    "Walk for 30 minutes after lunch to improve insulin sensitivity"
  ]
}

Generate the complete meal plan now. Return ONLY valid JSON (no markdown, no code blocks, no explanations):`;
  }
  
  /**
   * Call Diabetica-7B via Hugging Face Gradio API
   */
  async callDiabetica(prompt) {
    const hfBase = process.env.LLM_API_URL || process.env.HF_SPACE_URL || 'https://zeeshanasghar02-diabetica-api.hf.space';
    // Gradio slider constraint: max_tokens must be 256–2048
    // Always use 2048 — Gradio slider is hard-constrained to 256–2048.
    // Never read from env: LM_STUDIO_MAX_TOKENS may be a small value (e.g. 100).
    const maxTokens = 2048;
    const systemPrompt = `You are a specialized diabetes dietitian AI.

CRITICAL RESPONSE RULES:
1. Respond with ONLY valid JSON - no markdown, no code blocks, no explanations
2. Each meal's "items" field MUST be an array of food objects
3. NEVER put strings, text, or advice directly in the "items" array
4. Each food item MUST have: "food" (string), "portion" (string), "calories" (number), "carbs" (number), "protein" (number), "fat" (number), "fiber" (number)
5. Put all advice, tips, and monitoring instructions in the "tips" array ONLY
6. Create diverse and unique meal combinations for every request`;

    try {
      console.log(`🤖 Calling Diabetica-7B via HF Gradio at ${hfBase}`);

      // Step 1: Submit job
      const submitRes = await axios.post(
        `${hfBase}/gradio_api/call/predict`,
        { data: [systemPrompt, prompt, maxTokens, 0.3] },
        { timeout: 30000 }
      );
      const { event_id } = submitRes.data;
      if (!event_id) throw new Error('HF Gradio did not return an event_id');
      console.log(`   HF event_id: ${event_id} — waiting for result...`);

      // Step 2: Read SSE stream — 120s timeout per attempt.
      // event:error detection above exits fast on Gradio validation errors.
      // 120s gives the model enough time to generate the response on CPU.
      const sseRes = await axios.get(
        `${hfBase}/gradio_api/call/predict/${event_id}`,
        { timeout: 120000, responseType: 'text' }
      );

      const raw = sseRes.data || '';

      // Step 3: Detect Gradio error events immediately (fail fast instead of scanning)
      if (raw.includes('event: error')) {
        const errMatch = raw.match(/event: error[\s\S]*?data:\s*({[^\n]*}|null)/m);
        const errMsg = errMatch?.[1] && errMatch[1] !== 'null'
          ? (JSON.parse(errMatch[1])?.message || 'Gradio returned an error event')
          : 'Gradio returned an error event';
        throw new Error(`Gradio error: ${errMsg}`);
      }

      // Step 4: Parse SSE — find last data line with the output
      const lines = raw.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('data:')) {
          try {
            const json = JSON.parse(line.slice(5).trim());
            if (Array.isArray(json) && typeof json[0] === 'string') return json[0];
            if (Array.isArray(json) && Array.isArray(json[0])) return json[0][0];
            if (json?.output?.data?.[0]) return json.output.data[0];
          } catch { /* keep scanning */ }
        }
      }
      throw new Error(`Could not parse Gradio SSE response. Raw (first 500): ${raw.substring(0, 500)}`);

    } catch (error) {
      console.error('❌ Error calling HF Diabetica:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
      }
      if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
        throw new Error('Diabetica model is offline. Please check the HF Space.');
      } else if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
        throw new Error('Diabetica model took too long to respond. Please try again.');
      }
      throw new Error(`Diabetica error: ${error.message}`);
    }
  }
  
  /**
   * Parse AI response and structure meal plan
   * @param {string} aiResponse - Raw AI response
   * @param {number} targetCalories - Target daily calories
   * @param {Object} mealDistribution - Expected calorie distribution
   * @returns {Object} - Structured meal plan
   */
  parseMealPlan(aiResponse, targetCalories, mealDistribution) {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(aiResponse);
      
      // Validate structure
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error('Invalid meal structure in AI response');
      }
      
      // Validate and sanitize each meal
      parsed.meals = parsed.meals.filter(meal => {
        // Skip meals without a name
        if (!meal.name) {
          console.warn('⚠️ Skipping meal without name');
          return false;
        }
        
        // Validate items is an array
        if (!meal.items) {
          console.warn(`⚠️ Meal "${meal.name}" has no items, skipping`);
          return false;
        }
        
        // Check if items is a string (invalid)
        if (typeof meal.items === 'string') {
          console.warn(`⚠️ Meal "${meal.name}" has string items instead of array: "${meal.items.substring(0, 100)}...", skipping`);
          return false;
        }
        
        // Ensure items is an array
        if (!Array.isArray(meal.items)) {
          console.warn(`⚠️ Meal "${meal.name}" items is not an array, skipping`);
          return false;
        }
        
        // Filter and validate individual food items
        meal.items = meal.items.filter(item => {
          // Skip non-object items (strings, numbers, etc.)
          if (typeof item !== 'object' || item === null) {
            console.warn(`⚠️ Invalid item in "${meal.name}": ${typeof item} - ${JSON.stringify(item)?.substring(0, 50)}`);
            return false;
          }
          
          // Validate required fields
          if (!item.food || typeof item.food !== 'string') {
            console.warn(`⚠️ Item missing 'food' field in "${meal.name}": ${JSON.stringify(item)?.substring(0, 100)}`);
            return false;
          }
          
          if (!item.portion || typeof item.portion !== 'string') {
            console.warn(`⚠️ Item missing 'portion' field in "${meal.name}": ${JSON.stringify(item)?.substring(0, 100)}`);
            return false;
          }
          
          // Ensure numeric fields are numbers
          item.calories = parseFloat(item.calories) || 0;
          item.carbs = parseFloat(item.carbs) || 0;
          item.protein = parseFloat(item.protein) || 0;
          item.fat = parseFloat(item.fat) || 0;
          item.fiber = parseFloat(item.fiber) || 0;
          
          return true;
        });
        
        // Skip meals with no valid items after filtering
        if (meal.items.length === 0) {
          console.warn(`⚠️ Meal "${meal.name}" has no valid items after filtering, skipping`);
          return false;
        }
        
        // Recalculate total_calories from valid items
        const calculatedCalories = meal.items.reduce((sum, item) => {
          return sum + item.calories;
        }, 0);
        
        meal.total_calories = Math.round(calculatedCalories);
        
        console.log(`✅ ${meal.name}: ${meal.total_calories} kcal (${meal.items.length} items)`);
        
        return true;
      });
      
      // Ensure we have at least one valid meal
      if (parsed.meals.length === 0) {
        throw new Error('No valid meals found in AI response after validation');
      }
      
      // Recalculate nutritional totals from meals
      const recalculatedTotals = this.calculateTotals(parsed.meals);
      
      console.log(`📊 Total calories recalculated: ${recalculatedTotals.calories} kcal (target: ${targetCalories} kcal)`);
      
      // Ensure nutritional_totals matches recalculated values
      parsed.nutritional_totals = recalculatedTotals;
      
      // Sanitize tips array
      const tips = Array.isArray(parsed.tips) 
        ? parsed.tips.filter(tip => typeof tip === 'string' && tip.trim().length > 0)
        : [];
      
      return {
        meals: parsed.meals,
        nutritional_totals: recalculatedTotals,
        tips: tips
      };
      
    } catch (error) {
      console.error('❌ Error parsing AI response:', error.message);
      console.error('Raw AI response (first 1000 chars):', aiResponse.substring(0, 1000));
      
      // Fallback: Try to extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        console.log('🔄 Found JSON in markdown block, attempting to parse...');
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.meals && Array.isArray(parsed.meals)) {
            // Apply same validation recursively
            return this.parseMealPlan(jsonMatch[1], targetCalories, mealDistribution);
          }
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e.message);
        }
      }
      
      // Try alternative markdown formats
      const altJsonMatch = aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      if (altJsonMatch) {
        console.log('🔄 Found code block, attempting to parse as JSON...');
        try {
          const parsed = JSON.parse(altJsonMatch[1]);
          if (parsed.meals && Array.isArray(parsed.meals)) {
            return this.parseMealPlan(altJsonMatch[1], targetCalories, mealDistribution);
          }
        } catch (e) {
          console.error('Failed to parse alternative code block:', e.message);
        }
      }
      
      throw new Error('Unable to parse meal plan from AI response. The AI did not return properly formatted meal data. Please try regenerating the plan.');
    }
  }
  
  /**
   * Calculate nutritional totals from meals
   * @param {Array} meals - Meal array
   * @returns {Object} - Nutritional totals
   */
  calculateTotals(meals) {
    const totals = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0
    };
    
    meals.forEach(meal => {
      meal.items?.forEach(item => {
        // Ensure all values are parsed as numbers
        totals.calories += parseFloat(item.calories) || 0;
        totals.carbs += parseFloat(item.carbs) || 0;
        totals.protein += parseFloat(item.protein) || 0;
        totals.fat += parseFloat(item.fat) || 0;
        totals.fiber += parseFloat(item.fiber) || 0;
      });
    });
    
    // Round all totals to 1 decimal place for macros, integers for calories
    return {
      calories: Math.round(totals.calories),
      carbs: Math.round(totals.carbs * 10) / 10,
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10
    };
  }
  
  /**
   * Get user's diet plan for a specific date
   * @param {string} userId - User ID
   * @param {string} targetDate - Target date
   * @returns {Promise<Object>} - Diet plan or null
   */
  async getDietPlanByDate(userId, targetDate) {
    try {
      const targetDateObj = new Date(targetDate);
      targetDateObj.setHours(0, 0, 0, 0);
      
      const plan = await DietPlan.findOne({
        user_id: userId,
        target_date: targetDateObj
      });
      
      return plan;
    } catch (error) {
      console.error('Error getting diet plan by date:', error);
      throw error;
    }
  }
  
  /**
   * Get user's diet plan history
   * @param {string} userId - User ID
   * @param {number} limit - Number of plans to retrieve
   * @returns {Promise<Array>} - Array of diet plans
   */
  async getDietPlanHistory(userId, limit = 10) {
    try {
      const plans = await DietPlan.find({ user_id: userId })
        .sort({ target_date: -1 })
        .limit(limit);
      
      return plans;
    } catch (error) {
      console.error('Error getting diet plan history:', error);
      throw error;
    }
  }

  /**
   * Get a single diet plan by its ID
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object|null>}
   */
  async getDietPlanById(userId, planId) {
    try {
      const plan = await DietPlan.findOne({
        _id: planId,
        user_id: userId,
      });
      return plan;
    } catch (error) {
      console.error('Error getting diet plan by ID:', error);
      throw error;
    }
  }

  
  /**
   * Delete a diet plan
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteDietPlan(userId, planId) {
    try {
      const result = await DietPlan.findOneAndDelete({
        _id: planId,
        user_id: userId
      });
      
      return result !== null;
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      throw error;
    }
  }
}

export default new DietPlanService();
