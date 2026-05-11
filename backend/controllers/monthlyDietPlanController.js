import monthlyDietPlanService from '../services/monthlyDietPlanService.js';
import MonthlyDietPlan from '../models/MonthlyDietPlan.js';

/**
 * Generate a new monthly diet plan — FIRE-AND-FORGET (async)
 * POST /api/monthly-diet-plan/generate
 *
 * Returns 202 immediately after creating a 'pending' placeholder doc so that
 * mobile clients don't need to hold a long HTTP connection open while the
 * LLM (3–8 min) runs. Clients poll GET /status/:month/:year until 'complete'.
 */
export const generateMonthlyDietPlan = async (req, res) => {
  try {
    console.log('📥 generateMonthlyDietPlan called');
    console.log('User:', req.user?.email);

    const { month, year } = req.body;
    const userId = req.user._id;

    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'Month and year are required' });
    }

    const monthNum = parseInt(month);
    const yearNum  = parseInt(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, error: 'Invalid month. Must be between 1 and 12' });
    }
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid year' });
    }

    // Check for existing plan
    const existing = await MonthlyDietPlan.findOne({ user_id: userId, month: monthNum, year: yearNum });

    if (existing) {
      if (existing.generation_status === 'pending') {
        // If a pending plan is stale, remove it so the user can manually retry.
        const STALE_PENDING_MS = 2 * 60 * 60 * 1000; // 2 hours
        const createdAt = existing.created_at || existing.createdAt;
        const createdAtMs = createdAt ? new Date(createdAt).getTime() : Date.now();
        const ageMs = Date.now() - createdAtMs;

        if (ageMs > STALE_PENDING_MS) {
          await existing.deleteOne();
          console.warn(`⚠️ Deleted stale pending monthly plan for ${monthNum}/${yearNum} (age ${(ageMs / 60000).toFixed(0)} min)`);
        } else {
          // Still generating — tell client to keep polling
          return res.status(202).json({
            success: true,
            status: 'pending',
            planId: existing._id,
            month: monthNum,
            year: yearNum,
            message: 'Plan is already being generated. Keep polling /status.'
          });
        }
      }
      if (existing.generation_status === 'complete') {
        return res.status(409).json({
          success: false,
          error: `A diet plan already exists for ${monthNum}/${yearNum}. Please delete it first or view it.`
        });
      }
      // Status is 'failed' — delete and allow retry
      await existing.deleteOne();
      console.log(`🗑️ Deleted failed plan for ${monthNum}/${yearNum}, allowing retry`);
    }

    // Create a thin placeholder so the client can poll its status immediately
    const placeholder = new MonthlyDietPlan({
      user_id:           userId,
      month:             monthNum,
      year:              yearNum,
      region:            'Global',       // overwritten by background job
      total_daily_calories: 0,           // overwritten by background job
      meal_categories:   [],
      generation_status: 'pending',
      status:            'active',
    });
    await placeholder.save();
    console.log(`📌 Created pending placeholder plan ${placeholder._id} for ${monthNum}/${yearNum}`);

    // Return 202 NOW — client no longer waits for LLM
    res.status(202).json({
      success: true,
      status:  'pending',
      planId:  placeholder._id,
      month:   monthNum,
      year:    yearNum,
      message: 'Generation started. Poll GET /status/:month/:year for updates.'
    });

    // Fire-and-forget background generation — no await, response already sent
    monthlyDietPlanService.runBackgroundGeneration(userId, monthNum, yearNum, placeholder._id)
      .catch(err => console.error('❌ Unhandled background generation error:', err.message));

  } catch (error) {
    console.error('❌ Error in generateMonthlyDietPlan controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start monthly diet plan generation. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Poll generation status for a specific month/year
 * GET /api/monthly-diet-plan/status/:month/:year
 */
export const getGenerationStatus = async (req, res) => {
  try {
    const userId   = req.user._id;
    const monthNum = parseInt(req.params.month);
    const yearNum  = parseInt(req.params.year);

    if (isNaN(monthNum) || isNaN(yearNum)) {
      return res.status(400).json({ success: false, error: 'Invalid month or year' });
    }

    const plan = await MonthlyDietPlan.findOne({ user_id: userId, month: monthNum, year: yearNum });

    if (!plan) {
      return res.status(404).json({ success: false, status: 'not_found', error: 'No plan found for this month/year' });
    }

    // Build realistic ETA from this user's historical completed generations.
    const recentCompleted = await MonthlyDietPlan.find({
      user_id: userId,
      generation_status: 'complete',
      'generation_context.generation_duration_ms': { $exists: true, $gt: 0 }
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('generation_context.generation_duration_ms');

    const historicalDurations = recentCompleted
      .map((d) => d?.generation_context?.generation_duration_ms)
      .filter((ms) => typeof ms === 'number' && ms > 0);

    const DEFAULT_ESTIMATE_MS = 5 * 60 * 1000;
    const estimatedDurationMs = historicalDurations.length > 0
      ? Math.round(historicalDurations.reduce((sum, ms) => sum + ms, 0) / historicalDurations.length)
      : DEFAULT_ESTIMATE_MS;

    const startedAt = plan.created_at || plan.createdAt || new Date();
    const startedAtMs = new Date(startedAt).getTime();
    const elapsedMs = Math.max(0, Date.now() - startedAtMs);
    const remainingMs = plan.generation_status === 'pending'
      ? Math.max(0, estimatedDurationMs - elapsedMs)
      : 0;
    const progress = plan.generation_status === 'pending'
      ? Math.min(0.97, elapsedMs / Math.max(estimatedDurationMs, 1))
      : (plan.generation_status === 'complete' ? 1 : 0);

    const generationTiming = {
      startedAt,
      elapsedMs,
      estimatedDurationMs,
      remainingMs,
      progress,
    };

    return res.status(200).json({
      success: true,
      status:  plan.generation_status,   // 'pending' | 'complete' | 'failed'
      planId:  plan._id,
      month:   plan.month,
      year:    plan.year,
      generationTiming,
      // Send full plan only when complete so polling is lightweight
      plan:    plan.generation_status === 'complete' ? plan : undefined,
      error:   plan.generation_status === 'failed'   ? plan.generation_error : undefined,
    });
  } catch (error) {
    console.error('❌ Error in getGenerationStatus:', error);
    return res.status(500).json({ success: false, error: 'Failed to check generation status' });
  }
};

/**
 * Get active monthly diet plan
 * GET /api/monthly-diet-plan/current
 */
export const getCurrentMonthlyDietPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const plan = await monthlyDietPlanService.getActiveMonthlyPlan(userId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'No active monthly diet plan found. Generate one to get started!'
      });
    }
    
    return res.status(200).json({
      success: true,
      plan
    });
    
  } catch (error) {
    console.error('❌ Error in getCurrentMonthlyDietPlan controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve current monthly diet plan'
    });
  }
};

/**
 * Get monthly diet plan by ID
 * GET /api/monthly-diet-plan/:planId
 */
export const getMonthlyDietPlanById = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user._id;
    
    const MonthlyDietPlan = (await import('../models/MonthlyDietPlan.js')).default;
    
    const plan = await MonthlyDietPlan.findOne({
      _id: planId,
      user_id: userId
    });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Monthly diet plan not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      plan
    });
    
  } catch (error) {
    console.error('❌ Error in getMonthlyDietPlanById controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve monthly diet plan'
    });
  }
};

/**
 * Get monthly diet plan history
 * GET /api/monthly-diet-plan/history?limit=12
 */
export const getMonthlyDietPlanHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 12;
    
    if (limit < 1 || limit > 24) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 24'
      });
    }
    
    const plans = await monthlyDietPlanService.getMonthlyPlanHistory(userId, limit);
    
    return res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
    
  } catch (error) {
    console.error('❌ Error in getMonthlyDietPlanHistory controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve monthly diet plan history'
    });
  }
};

/**
 * Delete a monthly diet plan
 * DELETE /api/monthly-diet-plan/:planId
 */
export const deleteMonthlyDietPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user._id;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }
    
    const deleted = await monthlyDietPlanService.deleteMonthlyPlan(userId, planId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Monthly diet plan not found or already deleted'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Monthly diet plan deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in deleteMonthlyDietPlan controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete monthly diet plan'
    });
  }
};

/**
 * Save daily meal selections
 * POST /api/monthly-diet-plan/:planId/select
 */
export const saveDailySelection = async (req, res) => {
  try {
    const { planId } = req.params;
    const { date, selections } = req.body;
    const userId = req.user._id;
    
    if (!date || !selections) {
      return res.status(400).json({
        success: false,
        error: 'Date and selections are required'
      });
    }
    
    // Validate selections structure
    const requiredFields = ['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner'];
    const missingFields = requiredFields.filter(field => !selections[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing selections for: ${missingFields.join(', ')}`
      });
    }
    
    const updatedPlan = await monthlyDietPlanService.saveDailySelection(
      userId,
      planId,
      date,
      selections
    );
    
    return res.status(200).json({
      success: true,
      message: 'Daily selection saved successfully',
      plan: updatedPlan
    });
    
  } catch (error) {
    console.error('❌ Error in saveDailySelection controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save daily selection'
    });
  }
};

/**
 * Get meal option details
 * GET /api/monthly-diet-plan/:planId/option/:mealType/:optionName
 */
export const getMealOptionDetails = async (req, res) => {
  try {
    const { planId, mealType, optionName } = req.params;
    const userId = req.user._id;
    
    const MonthlyDietPlan = (await import('../models/MonthlyDietPlan.js')).default;
    
    const plan = await MonthlyDietPlan.findOne({
      _id: planId,
      user_id: userId
    });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Monthly diet plan not found'
      });
    }
    
    const option = plan.getMealOption(mealType, decodeURIComponent(optionName));
    
    if (!option) {
      return res.status(404).json({
        success: false,
        error: 'Meal option not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      option
    });
    
  } catch (error) {
    console.error('❌ Error in getMealOptionDetails controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve meal option details'
    });
  }
};
