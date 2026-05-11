import Category from '../models/Category.js';
import { validationResult } from 'express-validator';

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      search,
      sort = 'name'
    } = req.query;

    // Build filter
    let filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const categories = await Category.find(filter)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private (CMS permissions required)
export const createCategory = async (req, res) => {
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
      name,
      description,
      color,
      icon,
      isActive
    } = req.body;

    // Check if category with same name exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const newCategory = new Category({
      name,
      description,
      color: color || '#1976d2',
      icon: icon || 'article',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    await newCategory.save();

    const populatedCategory = await Category.findById(newCategory._id)
      .populate('createdBy', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private (CMS permissions required)
export const updateCategory = async (req, res) => {
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
      name,
      description,
      color,
      icon,
      isActive
    } = req.body;

    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({ 
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update fields
    if (name) existingCategory.name = name;
    if (description !== undefined) existingCategory.description = description;
    if (color) existingCategory.color = color;
    if (icon) existingCategory.icon = icon;
    if (isActive !== undefined) existingCategory.isActive = isActive;
    existingCategory.updatedBy = req.user.id;

    await existingCategory.save();

    const updatedCategory = await Category.findById(existingCategory._id)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private (CMS permissions required)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is being used by any content
    const Content = (await import('../models/Content.js')).default;
    const contentUsingCategory = await Content.findOne({ category: req.params.id });
    
    if (contentUsingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is being used by content. Please reassign or delete the content first.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// @desc    Get category statistics
// @route   GET /api/v1/categories/stats
// @access  Private (CMS permissions required)
export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Category.aggregate([
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveCategories: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    // Get content count per category
    const Content = (await import('../models/Content.js')).default;
    const categoryContentStats = await Content.aggregate([
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
          contentCount: { $sum: 1 },
          publishedContent: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { contentCount: -1 }
      }
    ]);

    const recentCategories = await Category.find()
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name slug color icon isActive createdAt createdBy');

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCategories: 0,
          activeCategories: 0,
          inactiveCategories: 0
        },
        categoryContentStats,
        recentCategories
      }
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: error.message
    });
  }
};