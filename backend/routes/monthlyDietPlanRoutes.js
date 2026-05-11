import express from 'express';
import * as monthlyDietPlanController from '../controllers/monthlyDietPlanController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyAccessTokenMiddleware);

/**
 * @route   POST /api/monthly-diet-plan/generate
 * @desc    Generate a new monthly diet plan with multiple options per meal
 * @access  Private
 * @body    { month: 1-12, year: 2024 }
 */
router.post('/generate', monthlyDietPlanController.generateMonthlyDietPlan);

/**
 * @route   GET /api/monthly-diet-plan/current
 * @desc    Get active monthly diet plan (current month)
 * @access  Private
 */
router.get('/current', monthlyDietPlanController.getCurrentMonthlyDietPlan);

/**
 * @route   GET /api/monthly-diet-plan/history
 * @desc    Get monthly diet plan history
 * @access  Private
 * @query   limit (optional, default: 12, max: 24)
 */
router.get('/history', monthlyDietPlanController.getMonthlyDietPlanHistory);

/**
 * @route   GET /api/monthly-diet-plan/status/:month/:year
 * @desc    Poll the generation status of a plan (pending | complete | failed)
 * @access  Private
 * @params  month (1-12), year
 *
 * MUST be declared before /:planId so Express doesn't treat "status" as a planId.
 */
router.get('/status/:month/:year', monthlyDietPlanController.getGenerationStatus);

/**
 * @route   GET /api/monthly-diet-plan/:planId
 * @desc    Get specific monthly diet plan by ID
 * @access  Private
 * @params  planId
 */
router.get('/:planId', monthlyDietPlanController.getMonthlyDietPlanById);

/**
 * @route   DELETE /api/monthly-diet-plan/:planId
 * @desc    Delete a monthly diet plan
 * @access  Private
 * @params  planId
 */
router.delete('/:planId', monthlyDietPlanController.deleteMonthlyDietPlan);

/**
 * @route   POST /api/monthly-diet-plan/:planId/select
 * @desc    Save daily meal selections
 * @access  Private
 * @params  planId
 * @body    { date: "2024-01-15", selections: { breakfast: "Option 1", ... } }
 */
router.post('/:planId/select', monthlyDietPlanController.saveDailySelection);

/**
 * @route   GET /api/monthly-diet-plan/:planId/option/:mealType/:optionName
 * @desc    Get specific meal option details
 * @access  Private
 * @params  planId, mealType, optionName
 */
router.get('/:planId/option/:mealType/:optionName', monthlyDietPlanController.getMealOptionDetails);

export default router;
