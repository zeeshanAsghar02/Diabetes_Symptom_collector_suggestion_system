import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  excerpt: {
    type: String,
    required: [true, 'Content excerpt is required'],
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Content body is required'],
    trim: true
  },
  featuredImage: {
    url: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [100, 'Alt text cannot exceed 100 characters']
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Content category is required']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  readingTime: {
    type: Number, // in minutes
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Clinical / editorial review metadata
  reviewStatus: {
    type: String,
    enum: ['pending', 'reviewed', 'not_required'],
    default: 'pending'
  },
  lastReviewedAt: {
    type: Date
  },
  nextReviewDate: {
    type: Date
  },
  reviewCycleMonths: {
    type: Number, // how often this content should be reviewed
    default: 12
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  lastReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create slug from title before saving
contentSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Indexes for better performance
contentSchema.index({ status: 1 });
contentSchema.index({ category: 1 });
contentSchema.index({ publishedAt: -1 });
contentSchema.index({ isFeatured: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ author: 1 });
contentSchema.index({ reviewStatus: 1 });
contentSchema.index({ nextReviewDate: 1 });

// Virtual for URL
contentSchema.virtual('url').get(function() {
  return `/content/${this.slug}`;
});

// Ensure virtual fields are serialized
contentSchema.set('toJSON', { virtuals: true });

const Content = mongoose.model('Content', contentSchema);

export default Content;
