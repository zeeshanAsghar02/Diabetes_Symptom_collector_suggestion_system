import express from 'express';
import { 
  generateWeeklyHabits, 
  getCurrentWeekHabits, 
  updateHabitProgress,
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit
} from '../controllers/habitsController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyAccessTokenMiddleware);

// --- LLM-based Weekly Habits ---
// Generate new weekly habits (or get existing)
router.post('/generate', generateWeeklyHabits);

// Get current week habits
router.get('/current', getCurrentWeekHabits);

// Update habit progress
router.post('/progress', updateHabitProgress);

// --- User-managed simple habits ---
router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);


export default router;
