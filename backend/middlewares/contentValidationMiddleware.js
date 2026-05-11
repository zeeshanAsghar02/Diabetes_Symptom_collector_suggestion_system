import { body, param, query } from 'express-validator';

// Category validation rules
export const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name cannot exceed 50 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Content validation rules
export const validateContent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Content title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('excerpt')
    .trim()
    .notEmpty()
    .withMessage('Content excerpt is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Excerpt must be between 10 and 500 characters'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content body is required')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters long'),
  
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      if (tags) {
        for (const tag of tags) {
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            throw new Error('Each tag must be a non-empty string');
          }
          if (tag.length > 30) {
            throw new Error('Each tag cannot exceed 30 characters');
          }
        }
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean value'),
  
  body('featuredImage.url')
    .optional()
    .isURL()
    .withMessage('Featured image URL must be valid'),
  
  body('featuredImage.alt')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Alt text cannot exceed 100 characters'),
  
  body('seo.metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  
  body('seo.metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  
  body('seo.keywords')
    .optional()
    .isArray()
    .withMessage('SEO keywords must be an array')
    .custom((keywords) => {
      if (keywords && keywords.length > 10) {
        throw new Error('Maximum 10 SEO keywords allowed');
      }
      return true;
    })
];

// Update validation rules (all fields optional)
export const validateContentUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('excerpt')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Excerpt must be between 10 and 500 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters long'),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      if (tags) {
        for (const tag of tags) {
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            throw new Error('Each tag must be a non-empty string');
          }
          if (tag.length > 30) {
            throw new Error('Each tag cannot exceed 30 characters');
          }
        }
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean value'),
  
  body('featuredImage.url')
    .optional()
    .isURL()
    .withMessage('Featured image URL must be valid'),
  
  body('featuredImage.alt')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Alt text cannot exceed 100 characters'),
  
  body('seo.metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  
  body('seo.metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  
  body('seo.keywords')
    .optional()
    .isArray()
    .withMessage('SEO keywords must be an array')
    .custom((keywords) => {
      if (keywords && keywords.length > 10) {
        throw new Error('Maximum 10 SEO keywords allowed');
      }
      return true;
    })
];

// Update category validation rules (all fields optional)
export const validateCategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name cannot exceed 50 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Query parameter validation
export const validateContentQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'all'])
    .withMessage('Status must be draft, published, archived, or all'),
  
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ID'),
  
  query('tag')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag must be between 1 and 30 characters'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sort')
    .optional()
    .matches(/^[+-]?(title|createdAt|updatedAt|publishedAt|viewCount)$/)
    .withMessage('Sort field must be title, createdAt, updatedAt, publishedAt, or viewCount with optional +/- prefix'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value')
];

export const validateCategoryQuery = [
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all'])
    .withMessage('Status must be active, inactive, or all')
];

// ID parameter validation
export const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Valid ID is required')
];

export const validateSlug = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
];
