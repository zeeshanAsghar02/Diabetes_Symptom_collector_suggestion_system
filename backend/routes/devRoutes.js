import express from 'express';
import ExercisePlan from '../models/ExercisePlan.js';
import LifestyleTip from '../models/LifestyleTip.js';
import { User } from '../models/User.js';
import exercisePlanService from '../services/exercisePlanService.js';
import lifestyleTipsService from '../services/lifestyleTipsService.js';

const router = express.Router();

// Delete all exercise plans for today (for testing purposes)
router.delete('/clear-today', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Delete plans for today
    const result = await ExercisePlan.deleteMany({
      target_date: {
        $gte: new Date(`${todayStr}T00:00:00.000Z`),
        $lt: new Date(`${todayStr}T23:59:59.999Z`)
      }
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} exercise plan(s) for today`,
      deletedCount: result.deletedCount,
      date: todayStr
    });
  } catch (error) {
    console.error('Error deleting today\'s plans:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete plans'
    });
  }
});

// Delete all lifestyle tips for today (for testing purposes)
router.delete('/clear-today-tips', async (req, res) => {
  try {
    // Use same date logic as the generation endpoint
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Delete tips for today using UTC midnight comparison
    const targetDateObj = new Date(todayStr);
    targetDateObj.setUTCHours(0, 0, 0, 0);
    
    const result = await LifestyleTip.deleteMany({
      target_date: targetDateObj
    });

    console.log(`🗑️ Deleted ${result.deletedCount} lifestyle tips for ${todayStr} (${targetDateObj.toISOString()})`);

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} lifestyle tip(s) for today`,
      deletedCount: result.deletedCount,
      date: todayStr
    });
  } catch (error) {
    console.error('Error deleting today\'s tips:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete tips'
    });
  }
});

// Force-refresh today's exercise/lifestyle generation for a specific user.
// Body: { email?: string, userId?: string }
router.post('/refresh-today-user', async (req, res) => {
  try {
    const { email, userId } = req.body || {};

    if (!email && !userId) {
      return res.status(400).json({
        success: false,
        error: 'Provide email or userId in request body',
      });
    }

    let user;
    if (userId) {
      user = await User.findById(userId).select('_id email').lean();
    } else {
      user = await User.findOne({ email }).select('_id email').lean();
    }

    if (!user?._id) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userIdStr = String(user._id);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDateStr = today.toISOString().split('T')[0];

    // Remove today's docs so old results cannot be shown.
    const [exerciseDeleteResult, tipsDeleteResult] = await Promise.all([
      ExercisePlan.deleteMany({ user_id: user._id, target_date: today }),
      LifestyleTip.deleteMany({ user_id: user._id, target_date: today }),
    ]);

    const exercisePlaceholder = new ExercisePlan({
      user_id: user._id,
      target_date: today,
      region: 'Global',
      sessions: [],
      totals: { duration_total_min: 0, calories_total: 0, sessions_count: 0 },
      status: 'pending',
      generation_status: 'pending',
    });

    const tipsPlaceholder = new LifestyleTip({
      user_id: user._id,
      target_date: today,
      region: 'Global',
      categories: [],
      status: 'active',
      generation_status: 'pending',
    });

    await Promise.all([exercisePlaceholder.save(), tipsPlaceholder.save()]);

    exercisePlanService
      .runBackgroundExerciseGeneration(userIdStr, targetDateStr, exercisePlaceholder._id)
      .catch((err) => console.error(`❌ [DEV] refresh exercise failed for ${userIdStr}:`, err.message));

    lifestyleTipsService
      .runBackgroundLifestyleTipsGeneration(userIdStr, targetDateStr, tipsPlaceholder._id)
      .catch((err) => console.error(`❌ [DEV] refresh lifestyle failed for ${userIdStr}:`, err.message));

    return res.status(202).json({
      success: true,
      message: 'Refresh triggered for user',
      user: { id: userIdStr, email: user.email || null },
      date: targetDateStr,
      deleted: {
        exercise: exerciseDeleteResult.deletedCount || 0,
        lifestyle: tipsDeleteResult.deletedCount || 0,
      },
      placeholders: {
        exercisePlanId: exercisePlaceholder._id,
        lifestyleTipsId: tipsPlaceholder._id,
      },
    });
  } catch (error) {
    console.error('Error refreshing user plans:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh user plans',
    });
  }
});

export default router;
