/**
 * Blog Model
 * Represents a blog post with SEO optimization features for the e-commerce platform
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    /**
     * Blog title - main heading of the blog post
     * @type {String}
     * @required
     * @example "10 Best Block-Printed Saree Designs"
     */
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [300, 'Blog title cannot exceed 300 characters'],
      minlength: [5, 'Blog title must be at least 5 characters'],
    },

    /**
     * URL-friendly slug auto-generated from title
     * @type {String}
     * @unique
     * @auto-generated
     * @example "10-best-block-printed-saree-designs"
     */
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values during creation
      lowercase: true,
      trim: true,
    },

    /**
     * Short description for blog listing and meta description
     * @type {String}
     * @required
     * @example "Explore the most popular block-printed saree designs that are trending this season..."
     */
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
      minlength: [20, 'Short description must be at least 20 characters'],
    },

    /**
     * Full blog content (can contain HTML)
     * @type {String}
     * @required
     */
    content: {
      type: String,
      required: [true, 'Blog content is required'],
      minlength: [30, 'Blog content must be at least 100 characters'],
    },

    /**
     * SEO Meta Title - used in browser tab and search results
     * @type {String}
     * @optional
     * @example "Block-Printed Saree Designs | FakiraFab"
     */
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta title cannot exceed 160 characters (SEO best practice)'],
    },

    /**
     * SEO Meta Description - displayed in search results
     * @type {String}
     * @optional
     * @example "Discover authentic block-printed saree designs..."
     */
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters (SEO best practice)'],
    },

    /**
     * SEO Keywords for search optimization
     * @type {[String]}
     * @optional
     * @example ["block-printed", "saree designs", "traditional wear"]
     */
    metaKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 10; // Limit to 10 keywords
        },
        message: 'Maximum 10 keywords allowed',
      },
    },

    /**
     * Blog banner/featured image URL
     * @type {String}
     * @optional
     * @note Can be integrated with Cloudinary for dynamic image uploads
     */
    image: {
      type: String,
      trim: true,
    },

    /**
     * Blog author name
     * @type {String}
     * @default "FakiraFab"
     */
    author: {
      type: String,
      default: 'FakiraFab',
      trim: true,
    },

    /**
     * Blog category for organization and filtering
     * @type {String}
     * @optional
     * @example "Styling Tips", "Product Guides", "Traditions", "DIY"
     */
    category: {
      type: String,
      trim: true,
      enum: {
        values: [
          'Styling Tips',
          'Product Guides',
          'Traditions',
          'DIY',
          'Care Tips',
          'Trending',
          'Fabric Guide',
          'Design Inspiration',
        ],
        message: 'Please select a valid blog category',
      },
    },

    /**
     * Tags for better content organization and discoverability
     * @type {[String]}
     * @default []
     * @example ["saree", "block-print", "handmade", "traditional"]
     */
    tags: {
      type: [String],
      default: [],
      trim: true,
    },

    /**
     * Publication status of the blog
     * @type {Boolean}
     * @default false
     */
    published: {
      type: Boolean,
      default: false,
      index: true, // Index for faster queries on published blogs
    },

    /**
     * Date when the blog was published
     * @type {Date}
     * @optional
     * @note Set automatically when published is set to true
     */
    publishedAt: {
      type: Date,
      default: null,
    },

    /**
     * View count for analytics
     * @type {Number}
     * @default 0
     */
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Soft delete flag for archive functionality
     * @type {Boolean}
     * @default false
     */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Timestamps
     * @type {Date}
     * @auto-generated
     */
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
  }
);

/**
 * Pre-save middleware to auto-generate slug from title
 * Handles duplicate slugs by appending timestamp
 */
blogSchema.pre('save', async function (next) {
  // Only generate slug for new documents or when title is modified
  if (!this.isModified('title')) {
    return next();
  }

  try {
    // Generate slug from title
    let slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Check for existing slug duplicates
    const existingBlog = await this.constructor.findOne({
      slug: slug,
      _id: { $ne: this._id }, // Exclude current document
      isDeleted: false,
    });

    // If slug exists, append timestamp to make it unique
    if (existingBlog) {
      slug = `${slug}-${Date.now()}`;
    }

    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-save middleware to set publishedAt when blog is published
 */
blogSchema.pre('save', function (next) {
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Clear publishedAt if blog is unpublished
  if (!this.published) {
    this.publishedAt = null;
  }

  next();
});

/**
 * Pre-find middleware to exclude deleted blogs by default
 */
blogSchema.pre(/^find/, function (next) {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

/**
 * Instance method to increment view count
 */
blogSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

/**
 * Static method to get published blogs
 */
blogSchema.statics.getPublished = function (query = {}) {
  return this.find({ ...query, published: true, isDeleted: false });
};

/**
 * Static method to soft delete a blog
 */
blogSchema.statics.softDelete = function (id) {
  return this.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

/**
 * Static method to permanently delete a blog
 */
blogSchema.statics.hardDelete = function (id) {
  return this.findByIdAndRemove(id);
};

/**
 * Create indexes for better query performance
 */
blogSchema.index({ slug: 1 });
blogSchema.index({ published: 1, isDeleted: 1 });
blogSchema.index({ category: 1, published: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index(
  { title: 'text', shortDescription: 'text', content: 'text' },
  { default_language: 'english' }
);

module.exports = mongoose.model('Blog', blogSchema);
