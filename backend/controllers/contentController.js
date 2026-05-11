import Content from '../models/Content.js';
import Category from '../models/Category.js';
import { validationResult } from 'express-validator';

// @desc    Get all content
// @route   GET /api/v1/content
// @access  Public
export const getAllContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'published',
      category,
      tag,
      search,
      sort = '-publishedAt',
      featured
    } = req.query;

    // Build filter
    let filter = {};
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (tag) {
      filter.tags = { $in: [tag.toLowerCase()] };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const content = await Content.find(filter)
      .populate('category', 'name slug color icon')
      .populate('author', 'fullName email')
      .populate('lastModifiedBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Content.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: content.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// @desc    Get single content
// @route   GET /api/v1/content/:id
// @access  Public
export const getContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('category', 'name slug color icon')
      .populate('author', 'fullName email')
      .populate('lastModifiedBy', 'fullName email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment view count for published content
    if (content.status === 'published') {
      content.viewCount += 1;
      await content.save();
    }

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// @desc    Get content by slug
// @route   GET /api/v1/content/slug/:slug
// @access  Public
export const getContentBySlug = async (req, res) => {
  try {
    const content = await Content.findOne({ slug: req.params.slug })
      .populate('category', 'name slug color icon')
      .populate('author', 'fullName email')
      .populate('lastModifiedBy', 'fullName email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Only show published content to public
    if (content.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment view count
    content.viewCount += 1;
    await content.save();

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// @desc    Create new content
// @route   POST /api/v1/content
// @access  Private (SuperAdmin only)
export const createContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      status,
      isFeatured,
      seo
    } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if content with same title exists
    const existingContent = await Content.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });

    if (existingContent) {
      return res.status(400).json({
        success: false,
        message: 'Content with this title already exists'
      });
    }

    const newContent = new Content({
      title,
      excerpt,
      content,
      featuredImage,
      category,
      tags: tags || [],
      status: status || 'draft',
      isFeatured: isFeatured || false,
      seo: seo || {},
      author: req.user.id
    });

    await newContent.save();

    const populatedContent = await Content.findById(newContent._id)
      .populate('category', 'name slug color icon')
      .populate('author', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: populatedContent
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating content',
      error: error.message
    });
  }
};

// @desc    Update content
// @route   PUT /api/v1/content/:id
// @access  Private (SuperAdmin only)
export const updateContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      status,
      isFeatured,
      seo
    } = req.body;

    const existingContent = await Content.findById(req.params.id);
    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Verify category exists if being updated
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Check if title is being changed and if it conflicts
    if (title && title !== existingContent.title) {
      const duplicateContent = await Content.findOne({ 
        _id: { $ne: req.params.id },
        title: { $regex: new RegExp(`^${title}$`, 'i') }
      });

      if (duplicateContent) {
        return res.status(400).json({
          success: false,
          message: 'Content with this title already exists'
        });
      }
    }

    // Update fields
    if (title) existingContent.title = title;
    if (excerpt) existingContent.excerpt = excerpt;
    if (content) existingContent.content = content;
    if (featuredImage) existingContent.featuredImage = featuredImage;
    if (category) existingContent.category = category;
    if (tags) existingContent.tags = tags;
    if (status) existingContent.status = status;
    if (isFeatured !== undefined) existingContent.isFeatured = isFeatured;
    if (seo) existingContent.seo = { ...existingContent.seo, ...seo };
    existingContent.lastModifiedBy = req.user.id;

    await existingContent.save();

    const updatedContent = await Content.findById(existingContent._id)
      .populate('category', 'name slug color icon')
      .populate('author', 'fullName email')
      .populate('lastModifiedBy', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: updatedContent
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
      error: error.message
    });
  }
};

// @desc    Delete content
// @route   DELETE /api/v1/content/:id
// @access  Private (SuperAdmin only)
export const deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await Content.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
};

// @desc    Update content review metadata
// @route   PUT /api/v1/content/:id/review
// @access  Private (SuperAdmin / content editors)
export const reviewContent = async (req, res) => {
  try {
    const { status, nextReviewDate, notes, reviewCycleMonths } = req.body;

    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const now = new Date();

    // Update review status if provided
    if (status && ['pending', 'reviewed', 'not_required'].includes(status)) {
      content.reviewStatus = status;
    }

    // When marking as reviewed, set lastReviewedAt / nextReviewDate
    if (status === 'reviewed') {
      content.lastReviewedAt = now;
      const cycle = reviewCycleMonths || content.reviewCycleMonths || 12;

      const next =
        nextReviewDate
          ? new Date(nextReviewDate)
          : new Date(now.getFullYear(), now.getMonth() + cycle, now.getDate());

      content.nextReviewDate = next;
      content.reviewCycleMonths = cycle;
      content.lastReviewedBy = req.user.id;
    }

    if (notes !== undefined) {
      content.reviewNotes = notes;
    }

    await content.save();

    const populatedContent = await Content.findById(content._id)
      .populate('category', 'name color')
      .populate('author', 'fullName email')
      .populate('lastReviewedBy', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Content review updated successfully',
      data: populatedContent
    });
  } catch (error) {
    console.error('Error updating content review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content review',
      error: error.message
    });
  }
};

// @desc    Get content statistics
// @route   GET /api/v1/content/stats
// @access  Private (SuperAdmin only)
export const getContentStats = async (req, res) => {
  try {
    const stats = await Content.aggregate([
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          publishedContent: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          draftContent: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          archivedContent: {
            $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
          },
          featuredContent: {
            $sum: { $cond: ['$isFeatured', 1, 0] }
          },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    const categoryStats = await Content.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$categoryInfo.name' },
          categoryColor: { $first: '$categoryInfo.color' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const recentContent = await Content.find({ status: 'published' })
      .populate('category', 'name color')
      .populate('author', 'fullName')
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title slug publishedAt viewCount category author');

    // Review queue: published content needing review (pending or overdue)
    const now = new Date();
    const reviewQuery = {
      status: 'published',
      $or: [
        { reviewStatus: 'pending' },
        { nextReviewDate: { $lte: now } }
      ]
    };

    const reviewQueue = await Content.find(reviewQuery)
      .populate('category', 'name color')
      .populate('author', 'fullName')
      .sort({ nextReviewDate: 1, updatedAt: -1 })
      .limit(10)
      .select('title slug publishedAt viewCount category author reviewStatus lastReviewedAt nextReviewDate');

    const needsReviewCount = await Content.countDocuments(reviewQuery);

    const overview =
      stats[0] || {
        totalContent: 0,
        publishedContent: 0,
        draftContent: 0,
        archivedContent: 0,
        featuredContent: 0,
        totalViews: 0
      };

    overview.needsReview = needsReviewCount;

    res.status(200).json({
      success: true,
      data: {
        overview,
        categoryStats,
        recentContent,
        reviewQueue
      }
    });
  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content statistics',
      error: error.message
    });
  }
};

// @desc    Get related content
// @route   GET /api/v1/content/:id/related
// @access  Public
export const getRelatedContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const relatedContent = await Content.find({
      _id: { $ne: req.params.id },
      status: 'published',
      $or: [
        { category: content.category },
        { tags: { $in: content.tags } }
      ]
    })
      .populate('category', 'name slug color icon')
      .populate('author', 'fullName')
      .sort({ publishedAt: -1 })
      .limit(4)
      .select('title slug excerpt featuredImage publishedAt readingTime viewCount category author');

    res.status(200).json({
      success: true,
      data: relatedContent
    });
  } catch (error) {
    console.error('Error fetching related content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related content',
      error: error.message
    });
  }
};
