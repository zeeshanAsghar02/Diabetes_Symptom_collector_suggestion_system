import express from 'express';
import * as dietPlanController from '../controllers/dietPlanController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyAccessTokenMiddleware);

/**
 * @route   POST /api/diet-plan/generate
 * @desc    Generate a new diet plan for a specific date
 * @access  Private
 * @body    { target_date: "YYYY-MM-DD" }
 */
router.post('/generate', dietPlanController.generateDietPlan);

/**
 * IMPORTANT: keep specific/static routes ABOVE '/:id'
 * Otherwise paths like '/history' or '/current' will be treated as an ':id'.
 */

/**
 * @route   GET /api/v1/diet-plan/current
 * @desc    Get today's diet plan
 * @access  Private
 */
router.get('/current', dietPlanController.getCurrentDietPlan);

/**
 * @route   GET /api/v1/diet-plan/history
 * @desc    Get diet plan history
 * @access  Private
 * @query   limit (optional, default: 10, max: 50)
 */
router.get('/history', dietPlanController.getDietPlanHistory);

/**
 * @route   GET /api/v1/diet-plan/region-coverage
 * @desc    Check diet plan coverage for user's region
 * @access  Private
 */
router.get('/region-coverage', dietPlanController.checkUserRegionCoverage);

/**
 * @route   GET /api/v1/diet-plan/regions
 * @desc    Get available regions with diet plan coverage
 * @access  Private
 */
router.get('/regions', dietPlanController.getAvailableRegions);

/**
 * @route   GET /api/v1/diet-plan/date/:date
 * @desc    Get diet plan for a specific date
 * @access  Private
 * @params  date (YYYY-MM-DD)
 */
router.get('/date/:date', dietPlanController.getDietPlanByDate);

/**
 * @route   GET /api/v1/diet-plan
 * @desc    Get all diet plans for the user
 * @access  Private
 */
router.get('/', dietPlanController.getAllDietPlans);

/**
 * @route   GET /api/v1/diet-plan/:id
 * @desc    Get a single diet plan by ID
 * @access  Private
 */
router.get('/:id', dietPlanController.getDietPlanById);

/**
 * @route   GET /api/v1/diet-plan/:id/download
 * @desc    Download a diet plan as a PDF
 * @access  Private
 */
router.get('/:id/download', dietPlanController.downloadDietPlanPDF);

/**
 * @route   DELETE /api/diet-plan/:id
 * @desc    Delete a specific diet plan
 * @access  Private
 * @params  planId
 */
router.delete('/:id', dietPlanController.deleteDietPlan);

export default router;
