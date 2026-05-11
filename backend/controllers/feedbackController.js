import { Feedback } from '../models/Feedback.js';
import { User } from '../models/User.js';

// Get all public feedback (for community dashboard)
export const getAllFeedback = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get all feedback that is not deleted, sorted by newest first
        const feedback = await Feedback.find({ deleted_at: null, status: 'published' })
            .populate('user_id', 'fullName email')
            .sort({ submitted_on: -1 })
            .skip(skip)
            .limit(limit);

        // Format feedback for public display (hide user info if anonymous)
        const formattedFeedback = feedback.map(fb => ({
            _id: fb._id,
            rating: fb.rating,
            comment: fb.comment,
            submitted_on: fb.submitted_on,
            is_anonymous: fb.is_anonymous,
            category_ratings: fb.category_ratings || undefined,
            user: fb.is_anonymous 
                ? { fullName: 'Anonymous', email: null }
                : { fullName: fb.user_id?.fullName || 'Unknown', email: null } // Don't expose email
        }));

        const total = await Feedback.countDocuments({ deleted_at: null, status: 'published' });

        return res.status(200).json({
            success: true,
            data: {
                feedback: formattedFeedback,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get all feedback error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching feedback'
        });
    }
};

// Get feedback statistics
export const getFeedbackStats = async (req, res) => {
    try {
        const feedbackWithRatings = await Feedback.find({ deleted_at: null }).select('rating category_ratings');
        const totalFeedback = feedbackWithRatings.length;
        
        // Calculate average rating
        const totalRatings = feedbackWithRatings.reduce((sum, fb) => sum + fb.rating, 0);
        const averageRating = totalFeedback > 0 ? (totalRatings / totalFeedback).toFixed(2) : 0;

        // Count by rating
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedbackWithRatings.forEach(fb => {
            if (ratingCounts[fb.rating] !== undefined) {
                ratingCounts[fb.rating]++;
            }
        });

        // Category averages (aggregate across all feedback that provided them)
        const categoryTotals = {};
        const categoryCounts = {};
        feedbackWithRatings.forEach(fb => {
            if (fb.category_ratings) {
                fb.category_ratings.forEach((value, key) => {
                    if (typeof value === 'number') {
                        categoryTotals[key] = (categoryTotals[key] || 0) + value;
                        categoryCounts[key] = (categoryCounts[key] || 0) + 1;
                    }
                });
            }
        });
        const categoryAverages = {};
        Object.keys(categoryTotals).forEach(key => {
            const avg = categoryTotals[key] / (categoryCounts[key] || 1);
            categoryAverages[key] = parseFloat(avg.toFixed(2));
        });

        return res.status(200).json({
            success: true,
            data: {
                totalFeedback,
                averageRating: parseFloat(averageRating),
                ratingCounts,
                categoryAverages
            }
        });
    } catch (error) {
        console.error('Get feedback stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching feedback statistics'
        });
    }
};

// Get current user's feedback
export const getMyFeedback = async (req, res) => {
    try {
        const userId = req.user._id;

        const feedback = await Feedback.find({ 
            user_id: userId,
            deleted_at: null 
        })
        .sort({ submitted_on: -1 });

        return res.status(200).json({
            success: true,
            data: {
                feedback
            }
        });
    } catch (error) {
        console.error('Get my feedback error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching your feedback'
        });
    }
};

// Submit new feedback
export const submitFeedback = async (req, res) => {
    try {
        const userId = req.user._id;
        const { rating, comment, is_anonymous, category_ratings } = req.body;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Validate category ratings if provided
        let parsedCategoryRatings = undefined;
        if (category_ratings && typeof category_ratings === 'object') {
            parsedCategoryRatings = {};
            Object.entries(category_ratings).forEach(([key, value]) => {
                const num = Number(value);
                if (num >= 1 && num <= 5) {
                    parsedCategoryRatings[key] = num;
                }
            });
            if (Object.keys(parsedCategoryRatings).length === 0) {
                parsedCategoryRatings = undefined;
            }
        }

        // Create feedback
        const feedback = new Feedback({
            user_id: userId,
            rating: parseInt(rating),
            comment: comment || null,
            is_anonymous: is_anonymous === true || is_anonymous === 'true',
            category_ratings: parsedCategoryRatings
        });

        await feedback.save();

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: {
                feedback
            }
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting feedback'
        });
    }
};

// Update own feedback
export const updateFeedback = async (req, res) => {
    try {
        const userId = req.user._id;
        const feedbackId = req.params.id;
        const { rating, comment, is_anonymous, category_ratings } = req.body;

        const feedback = await Feedback.findOne({ 
            _id: feedbackId,
            user_id: userId,
            deleted_at: null
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found or you do not have permission to update it'
            });
        }

        // Update fields
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }
            feedback.rating = parseInt(rating);
        }

        if (comment !== undefined) {
            feedback.comment = comment || null;
        }

        if (is_anonymous !== undefined) {
            feedback.is_anonymous = is_anonymous === true || is_anonymous === 'true';
        }

        if (category_ratings !== undefined) {
            let parsedCategoryRatings = undefined;
            if (category_ratings && typeof category_ratings === 'object') {
                parsedCategoryRatings = {};
                Object.entries(category_ratings).forEach(([key, value]) => {
                    const num = Number(value);
                    if (num >= 1 && num <= 5) {
                        parsedCategoryRatings[key] = num;
                    }
                });
                if (Object.keys(parsedCategoryRatings).length === 0) {
                    parsedCategoryRatings = undefined;
                }
            }
            feedback.category_ratings = parsedCategoryRatings;
        }

        await feedback.save();

        return res.status(200).json({
            success: true,
            message: 'Feedback updated successfully',
            data: {
                feedback
            }
        });
    } catch (error) {
        console.error('Update feedback error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating feedback'
        });
    }
};

// Delete own feedback (soft delete)
export const deleteFeedback = async (req, res) => {
    try {
        const userId = req.user._id;
        const feedbackId = req.params.id;

        const feedback = await Feedback.findOne({ 
            _id: feedbackId,
            user_id: userId,
            deleted_at: null
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found or you do not have permission to delete it'
            });
        }

        // Soft delete
        feedback.deleted_at = new Date();
        await feedback.save();

        return res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        console.error('Delete feedback error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting feedback'
        });
    }
};

// ---------------------- ADMIN ENDPOINTS ----------------------

// Admin: list feedback with filters/search/sort/pagination
export const getAdminFeedbackList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, rating, status, category, startDate, endDate, sort } = req.query;

        const filter = { deleted_at: null };
        if (rating && !Number.isNaN(Number(rating))) filter.rating = Number(rating);
        if (status && ['published', 'hidden'].includes(status)) filter.status = status;
        if (category && category !== 'all') filter[`category_ratings.${category}`] = { $exists: true };
        if (startDate || endDate) {
            filter.submitted_on = {};
            if (startDate) filter.submitted_on.$gte = new Date(startDate);
            if (endDate) filter.submitted_on.$lte = new Date(endDate);
        }
        if (search && search !== 'undefined') {
            filter.comment = { $regex: search, $options: 'i' };
        }

        let sortOption = { submitted_on: -1 };
        if (sort === 'oldest') sortOption = { submitted_on: 1 };
        if (sort === 'highest') sortOption = { rating: -1 };
        if (sort === 'lowest') sortOption = { rating: 1 };

        const feedback = await Feedback.find(filter)
            .populate('user_id', 'fullName email')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const total = await Feedback.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: {
                feedback,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Admin list feedback error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching feedback'
        });
    }
};

// Admin: update status (publish/hide)
export const updateFeedbackStatus = async (req, res) => {
    try {
        const feedbackId = req.params.id;
        const { status } = req.body;
        if (!['published', 'hidden'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const feedback = await Feedback.findOne({ _id: feedbackId, deleted_at: null });
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }
        feedback.status = status;
        await feedback.save();
        return res.status(200).json({ success: true, data: { feedback } });
    } catch (error) {
        console.error('Update feedback status error:', error);
        return res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

// Admin: add/update response
export const addAdminResponse = async (req, res) => {
    try {
        const feedbackId = req.params.id;
        const { admin_response } = req.body;
        const feedback = await Feedback.findOne({ _id: feedbackId, deleted_at: null });
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }
        feedback.admin_response = admin_response || null;
        await feedback.save();
        return res.status(200).json({ success: true, data: { feedback } });
    } catch (error) {
        console.error('Add admin response error:', error);
        return res.status(500).json({ success: false, message: 'Error saving admin response' });
    }
};

// Admin: soft delete
export const adminDeleteFeedback = async (req, res) => {
    try {
        const feedbackId = req.params.id;
        const feedback = await Feedback.findOne({ _id: feedbackId, deleted_at: null });
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }
        feedback.deleted_at = new Date();
        await feedback.save();
        return res.status(200).json({ success: true, message: 'Feedback deleted' });
    } catch (error) {
        console.error('Admin delete feedback error:', error);
        return res.status(500).json({ success: false, message: 'Error deleting feedback' });
    }
};

// Admin: restore
export const adminRestoreFeedback = async (req, res) => {
    try {
        const feedbackId = req.params.id;
        const feedback = await Feedback.findOne({ _id: feedbackId });
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }
        feedback.deleted_at = null;
        await feedback.save();
        return res.status(200).json({ success: true, message: 'Feedback restored', data: { feedback } });
    } catch (error) {
        console.error('Admin restore feedback error:', error);
        return res.status(500).json({ success: false, message: 'Error restoring feedback' });
    }
};

// Admin: stats with trends/positivity
export const getAdminFeedbackStats = async (req, res) => {
    try {
        const { days } = req.query;
        const rangeDays = parseInt(days) || 30;
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - rangeDays);

        const baseFilter = { deleted_at: null };
        const allFeedback = await Feedback.find(baseFilter).select('rating status category_ratings submitted_on');
        const totalFeedback = allFeedback.length;
        const publishedCount = allFeedback.filter(f => f.status === 'published').length;
        const hiddenCount = allFeedback.filter(f => f.status === 'hidden').length;
        const positiveCount = allFeedback.filter(f => f.rating >= 4).length;
        const totalRatings = allFeedback.reduce((sum, f) => sum + (f.rating || 0), 0);
        const averageRating = totalFeedback > 0 ? parseFloat((totalRatings / totalFeedback).toFixed(2)) : 0;
        const positiveRate = totalFeedback > 0 ? parseFloat(((positiveCount / totalFeedback) * 100).toFixed(2)) : 0;

        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const categoryTotals = {};
        const categoryCounts = {};
        allFeedback.forEach(fb => {
            if (ratingCounts[fb.rating] !== undefined) ratingCounts[fb.rating] += 1;
            if (fb.category_ratings) {
                fb.category_ratings.forEach((v, k) => {
                    if (typeof v === 'number') {
                        categoryTotals[k] = (categoryTotals[k] || 0) + v;
                        categoryCounts[k] = (categoryCounts[k] || 0) + 1;
                    }
                });
            }
        });
        const categoryAverages = {};
        Object.keys(categoryTotals).forEach(k => {
            categoryAverages[k] = parseFloat((categoryTotals[k] / (categoryCounts[k] || 1)).toFixed(2));
        });

        // Time series (per day) for last rangeDays
        const timeSeriesPipeline = [
            { $match: { deleted_at: null, submitted_on: { $gte: sinceDate } } },
            {
                $group: {
                    _id: {
                        y: { $year: '$submitted_on' },
                        m: { $month: '$submitted_on' },
                        d: { $dayOfMonth: '$submitted_on' }
                    },
                    count: { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                    positive: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } }
                }
            },
            { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
        ];
        const tsRaw = await Feedback.aggregate(timeSeriesPipeline);
        const timeSeries = tsRaw.map(item => {
            const date = new Date(item._id.y, item._id.m - 1, item._id.d);
            const count = item.count || 0;
            const positiveRateTs = count > 0 ? parseFloat(((item.positive / count) * 100).toFixed(2)) : 0;
            return {
                date: date.toISOString().split('T')[0],
                count,
                avgRating: parseFloat((item.avgRating || 0).toFixed(2)),
                positiveRate: positiveRateTs
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                totalFeedback,
                publishedCount,
                hiddenCount,
                averageRating,
                positiveRate,
                ratingCounts,
                categoryAverages,
                timeSeries
            }
        });
    } catch (error) {
        console.error('Admin feedback stats error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching admin stats' });
    }
};

