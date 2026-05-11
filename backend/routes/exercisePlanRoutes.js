import express from 'express';
import * as exercisePlanController from '../controllers/exercisePlanController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAccessTokenMiddleware);

// Order: specific before generic where necessary
router.post('/auto-generate', exercisePlanController.autoGenerateExercisePlan);
// Fire-and-forget: ensure today's plan exists (async, 202 + poll)
router.post('/ensure-today', exercisePlanController.ensureTodayExercisePlan);
// Poll today's generation status
router.get('/status/today', exercisePlanController.getExercisePlanStatusToday);
router.get('/region-coverage', exercisePlanController.checkUserRegionCoverage);
router.get('/regions', exercisePlanController.getAvailableRegions);

router.post('/generate', exercisePlanController.generateExercisePlan);

/**
 * @route   GET /api/v1/exercise-plan
 * @desc    Get all exercise plans for the user
 * @access  Private
 */
router.get('/', exercisePlanController.getExercisePlanHistory);

// IMPORTANT: keep specific/static routes above '/:id'
router.get('/current', exercisePlanController.getCurrentExercisePlan);
router.get('/date/:date', exercisePlanController.getExercisePlanByDate);
router.get('/history', exercisePlanController.getExercisePlanHistory);

/**
 * @route   GET /api/v1/exercise-plan/:id
 * @desc    Get a single exercise plan by ID
 * @access  Private
 */
router.get('/:id', exercisePlanController.getExercisePlanById);

/**
 * @route   GET /api/v1/exercise-plan/:id/download
 * @desc    Download an exercise plan as a PDF
 * @access  Private
 */
router.get('/:id/download', exercisePlanController.downloadExercisePlanPDF);
router.delete('/:id', exercisePlanController.deleteExercisePlan);

export default router;
