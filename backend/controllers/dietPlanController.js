import dietPlanService from '../services/dietPlanService.js';
import regionDiscoveryService from '../services/regionDiscoveryService.js';
import { generateDietPlanPDF } from '../services/pdfGenerationService.js';
import { sendDietPlanEmail } from '../services/emailService.js';
import { User } from '../models/User.js';

/**
 * Generate a new diet plan
 * POST /api/diet-plan/generate
 */
const generateDietPlan = async (req, res) => {
  try {
    console.log('📥 generateDietPlan called with body:', req.body);
    console.log('📥 User from middleware:', { _id: req.user?._id, email: req.user?.email, country: req.user?.country });
    
    const { target_date } = req.body;
    const userId = req.user._id;
    
    console.log('🔍 userId:', userId, 'target_date:', target_date);
    
    if (!target_date) {
      return res.status(400).json({
        success: false,
        error: 'Target date is required (format: YYYY-MM-DD)'
      });
    }
    
    // Validate: target_date must be today or future (max 5 days ahead)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(target_date);
    targetDate.setHours(0, 0, 0, 0);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const daysDiff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate plans for past dates'
      });
    }
    
    if (daysDiff > 5) {
      return res.status(400).json({
        success: false,
        error: 'Can only generate plans up to 5 days ahead'
      });
    }
    
    // Generate the plan
    const result = await dietPlanService.generateDietPlan(userId, target_date);
    
    // Generate PDF and send email in background (don't wait for it)
    setImmediate(async () => {
      try {
        const user = await User.findById(userId);
        if (user && user.email) {
          const userInfo = {
            fullName: user.fullName,
            email: user.email
          };
          
          const pdfPath = await generateDietPlanPDF(result.plan, userInfo);
          await sendDietPlanEmail(user.email, user.fullName, pdfPath, result.plan);
          console.log('✅ Diet plan email sent successfully to:', user.email);
        }
      } catch (emailError) {
        console.error('❌ Error sending diet plan email:', emailError.message);
        // Don't fail the request if email fails
      }
    });
    
    return res.status(201).json({
      success: true,
      message: 'Diet plan generated successfully',
      emailSent: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error in generateDietPlan controller:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not found') && !error.message.includes('dietary documents')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate diet plan. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get diet plan for a specific date
 * GET /api/diet-plan/date/:date
 */
const getDietPlanByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user._id;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }
    
    const plan = await dietPlanService.getDietPlanByDate(userId, date);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'No diet plan found for this date'
      });
    }
    
    return res.status(200).json({
      success: true,
      plan
    });
    
  } catch (error) {
    console.error('Error in getDietPlanByDate controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve diet plan'
    });
  }
};

/**
 * Get current/active diet plan (today's plan)
 * GET /api/diet-plan/current
 */
const getCurrentDietPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const plan = await dietPlanService.getDietPlanByDate(userId, today);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'No diet plan found for today. Generate one to get started!'
      });
    }
    
    return res.status(200).json({
      success: true,
      plan
    });
    
  } catch (error) {
    console.error('Error in getCurrentDietPlan controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve current diet plan'
    });
  }
};

/**
 * Get diet plan history
 * GET /api/diet-plan/history?limit=10
 */
const getDietPlanHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 50'
      });
    }
    
    const plans = await dietPlanService.getDietPlanHistory(userId, limit);
    
    return res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
    
  } catch (error) {
    console.error('Error in getDietPlanHistory controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve diet plan history'
    });
  }
};

/**
 * Delete a diet plan
 * DELETE /api/diet-plan/:planId
 */
const deleteDietPlan = async (req, res) => {
  try {
    const planId = req.params.planId || req.params.id;
    const userId = req.user._id;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }
    
    const deleted = await dietPlanService.deleteDietPlan(userId, planId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found or already deleted'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Diet plan deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in deleteDietPlan controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete diet plan'
    });
  }
};

/**
 * Get available regions for diet plans
 * GET /api/diet-plan/regions
 */
const getAvailableRegions = async (req, res) => {
  try {
    const regions = await regionDiscoveryService.getAllRegionStats('diet');
    
    return res.status(200).json({
      success: true,
      regions
    });
    
  } catch (error) {
    console.error('Error in getAvailableRegions controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve available regions'
    });
  }
};

/**
 * Check region coverage for user
 * GET /api/diet-plan/region-coverage
 */
const checkUserRegionCoverage = async (req, res) => {
  try {
    console.log('📥 checkUserRegionCoverage called');
    console.log('📥 req.user:', { _id: req.user?._id, email: req.user?.email });
    
    const userId = req.user._id;
    const { User } = await import('../models/User.js');
    
    console.log('🔍 Fetching user with ID:', userId);
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('❌ User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log(`👤 User found: ${user.email}, country: "${user.country}"`);
    console.log(`👤 User country from DB: "${user.country}"`);
    
    const userCountry = user.country || user.address?.country || 'Unknown';
    console.log('🌍 Using country for coverage check:', userCountry);
    
    const coverage = await regionDiscoveryService.checkRegionCoverage(userCountry, 'diet_chart');
    
    console.log(`📋 Coverage result:`, coverage);
    
    return res.status(200).json({
      success: true,
      coverage
    });
    
  } catch (error) {
    console.error('Error in checkUserRegionCoverage controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check region coverage'
    });
  }
};

/**
 * Get all diet plans for the logged-in user
 * GET /api/v1/diet-plan
 */
const getAllDietPlans = async (req, res) => {
  try {
    const userId = req.user._id;
    const plans = await dietPlanService.getDietPlanHistory(userId, 50); // Get up to 50 recent plans

    return res.status(200).json({
      success: true,
      message: 'Diet plans retrieved successfully',
      data: plans,
    });
  } catch (error) {
    console.error('Error in getAllDietPlans controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve diet plans',
    });
  }
};

/**
 * Get a single diet plan by its ID
 * GET /api/v1/diet-plan/:id
 */
const getDietPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const plan = await dietPlanService.getDietPlanById(userId, id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Diet plan retrieved successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Error in getDietPlanById controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve diet plan details',
    });
  }
};

/**
 * Download a diet plan as a PDF
 * GET /api/v1/diet-plan/:id/download
 */
const downloadDietPlanPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const plan = await dietPlanService.getDietPlanById(userId, id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found',
      });
    }

    const user = await User.findById(userId);
    const userInfo = {
      fullName: user.fullName,
      email: user.email,
    };

    const pdfPath = await generateDietPlanPDF(plan, userInfo);

    res.download(pdfPath, `Diet-Plan-${plan.target_date}.pdf`, (err) => {
      if (err) {
        console.error('Error sending PDF file:', err);
        // The response may already be partially sent, so we can't send a new one.
        // The error will be logged.
      }
    });
  } catch (error) {
    console.error('Error in downloadDietPlanPDF controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate or download PDF',
    });
  }
};

export {
  generateDietPlan,
  getAllDietPlans,
  getDietPlanById,
  getDietPlanByDate,
  getCurrentDietPlan,
  getDietPlanHistory,
  deleteDietPlan,
  getAvailableRegions,
  checkUserRegionCoverage,
  downloadDietPlanPDF,
};
