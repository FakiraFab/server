/**
 * Blog Controller
 * Handles all blog-related operations: CRUD, search, filtering, publishing
 */

const Blog = require('../models/blog');
const { blogCreateSchema, blogUpdateSchema, publishStatusSchema } = require('../schemas/blogSchema');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { ErrorMessages, StatusCodes } = require('../utils/errorMessages');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Create a new blog post
 * POST /api/blogs
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {Object} Created blog object
 * @throws {AppError} If validation fails or database error occurs
 */
const createBlog = catchAsync(async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = blogCreateSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      const messages = error.details.map((e) => e.message).join(', ');
      return next(new AppError(messages, StatusCodes.BAD_REQUEST));
    }

    // Check for duplicate title (optional but recommended)
    const existingBlog = await Blog.findOne({ title: value.title, isDeleted: false });
    if (existingBlog) {
      return next(new AppError('A blog with this title already exists', StatusCodes.CONFLICT));
    }

    // Create the blog
    const blog = await Blog.create(value);

    logger.info('Blog created successfully', {
      blogId: blog._id,
      title: blog.title,
      author: blog.author,
    });

    ResponseHandler.created(res, blog, 'Blog created successfully');
  } catch (error) {
    logger.error('Blog creation error', {
      error: error.message,
      body: req.body,
    });

    if (error.code === 11000) {
      return next(new AppError('A blog with this slug already exists', StatusCodes.CONFLICT));
    }

    next(error);
  }
});

/**
 * Get all blogs with pagination, filtering, and sorting
 * GET /api/blogs?page=1&limit=10&published=true&category=Styling%20Tips&sort=-createdAt
 *
 * @param {Object} req - Express request object
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 10, max: 100)
 * @param {boolean} req.query.published - Filter by published status (optional)
 * @param {string} req.query.category - Filter by category (optional)
 * @param {string} req.query.tag - Filter by tag (optional)
 * @param {string} req.query.sort - Sort field (default: -createdAt)
 * @param {string} req.query.search - Search in title, shortDescription, content (optional)
 *
 * @returns {Object} Paginated blog list with filters info
 */
const getAllBlogs = catchAsync(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      published,
      category,
      tag,
      sort = '-createdAt',
      search,
    } = req.query;

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { isDeleted: false };

    // Published filter
    if (published !== undefined) {
      filter.published = published === 'true' || published === true;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Tag filter
    if (tag) {
      filter.tags = { $in: [tag] };
    }

    // Text search
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // Execute query with sorting
    let query = Blog.find(filter);

    if (search && search.trim()) {
      query = query.sort({ score: { $meta: 'textScore' } });
    } else {
      query = query.sort(sort);
    }

    const blogs = await query
      .skip(skip)
      .limit(limitNum)
      .select('-content') // Exclude full content for list view
      .lean();

    const total = await Blog.countDocuments(filter);

    // Get available categories and tags for filtering
    const categories = await Blog.distinct('category', { isDeleted: false });
    const tags = await Blog.distinct('tags', { isDeleted: false });

    ResponseHandler.paginated(res, {
      data: blogs,
      page: pageNum,
      limit: limitNum,
      total,
      message: 'Blogs retrieved successfully',
      meta: {
        categories: categories.filter((c) => c), // Remove empty values
        tags: tags.filter((t) => t),
        hasMore: skip + blogs.length < total,
      },
    });
  } catch (error) {
    logger.error('Get all blogs error', {
      error: error.message,
      query: req.query,
    });
    next(error);
  }
});

/**
 * Get a single blog by slug (SEO-friendly)
 * GET /api/blogs/slug/:slug
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.slug - Blog slug
 *
 * @returns {Object} Full blog object with all details
 * @throws {AppError} If blog not found
 */
const getBlogBySlug = catchAsync(async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug || slug.trim() === '') {
      return next(new AppError('Blog slug is required', StatusCodes.BAD_REQUEST));
    }

    const blog = await Blog.findOne({
      slug: slug.toLowerCase(),
      isDeleted: false,
      published: true,
    });
   
    if (!blog) {
      return next(
        new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Blog'), StatusCodes.NOT_FOUND)
      );
    }

    // Increment view count asynchronously (don't wait for it)
    blog.incrementViews().catch((err) => logger.error('Failed to increment blog views', err));

    ResponseHandler.success(res, {
      data: blog,
      message: 'Blog retrieved successfully',
    });
  } catch (error) {
    logger.error('Get blog by slug error', {
      error: error.message,
      slug: req.params.slug,
    });
    next(error);
  }
});

/**
 * Get a single blog by ID (admin view, can see unpublished)
 * GET /api/blogs/:id
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Blog MongoDB ID
 *
 * @returns {Object} Full blog object with all details
 * @throws {AppError} If blog ID is invalid or not found
 */
const getBlogById = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid blog ID format', StatusCodes.BAD_REQUEST));
    }

    const blog = await Blog.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!blog) {
      return next(
        new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Blog'), StatusCodes.NOT_FOUND)
      );
    }

    ResponseHandler.success(res, {
      data: blog,
      message: 'Blog retrieved successfully',
    });
  } catch (error) {
    logger.error('Get blog by ID error', {
      error: error.message,
      id: req.params.id,
    });
    next(error);
  }
});

/**
 * Update a blog post
 * PUT /api/blogs/:id
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Blog MongoDB ID
 *
 * @returns {Object} Updated blog object
 * @throws {AppError} If validation fails, blog not found, or database error occurs
 */
const updateBlog = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid blog ID format', StatusCodes.BAD_REQUEST));
    }

    // Validate request body
    const { error, value } = blogUpdateSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      const messages = error.details.map((e) => e.message).join(', ');
      return next(new AppError(messages, StatusCodes.BAD_REQUEST));
    }

    // Check if blog exists
    const blog = await Blog.findOne({ _id: id, isDeleted: false });
    if (!blog) {
      return next(
        new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Blog'), StatusCodes.NOT_FOUND)
      );
    }

    // Check for duplicate title if title is being updated
    if (value.title && value.title !== blog.title) {
      const existingBlog = await Blog.findOne({
        title: value.title,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existingBlog) {
        return next(new AppError('A blog with this title already exists', StatusCodes.CONFLICT));
      }
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(id, value, {
      new: true,
      runValidators: true,
    });

    logger.info('Blog updated successfully', {
      blogId: id,
      fields: Object.keys(value),
    });

    ResponseHandler.success(res, {
      statusCode: StatusCodes.OK,
      data: updatedBlog,
      message: 'Blog updated successfully',
    });
  } catch (error) {
    logger.error('Blog update error', {
      error: error.message,
      id: req.params.id,
    });

    if (error.code === 11000) {
      return next(new AppError('A blog with this slug already exists', StatusCodes.CONFLICT));
    }

    next(error);
  }
});

/**
 * Toggle publish status of a blog
 * PATCH /api/blogs/:id/publish
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Blog MongoDB ID
 * @param {boolean} req.body.published - New publish status
 *
 * @returns {Object} Updated blog object with new publish status
 */
const publishBlog = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid blog ID format', StatusCodes.BAD_REQUEST));
    }

    // Validate request body
    const { error, value } = publishStatusSchema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
    }

    // Check if blog exists
    const blog = await Blog.findOne({ _id: id, isDeleted: false });
    if (!blog) {
      return next(
        new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Blog'), StatusCodes.NOT_FOUND)
      );
    }

    // Update publish status
    blog.published = value.published;
    await blog.save();

    logger.info('Blog publish status updated', {
      blogId: id,
      published: value.published,
      publishedAt: blog.publishedAt,
    });

    ResponseHandler.success(res, {
      data: blog,
      message: `Blog ${value.published ? 'published' : 'unpublished'} successfully`,
    });
  } catch (error) {
    logger.error('Blog publish status update error', {
      error: error.message,
      id: req.params.id,
    });
    next(error);
  }
});

/**
 * Delete a blog (soft delete - marks as deleted)
 * DELETE /api/blogs/:id
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Blog MongoDB ID
 * @param {boolean} req.query.permanent - If true, performs hard delete (default: false)
 *
 * @returns {Object} Success message
 */
const deleteBlog = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid blog ID format', StatusCodes.BAD_REQUEST));
    }

    // Check if blog exists
    const blog = await Blog.findById(id);
    if (!blog) {
      return next(
        new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Blog'), StatusCodes.NOT_FOUND)
      );
    }

    if (permanent === 'true') {
      // Hard delete (permanent removal)
      await Blog.findByIdAndRemove(id);
      logger.info('Blog permanently deleted', { blogId: id });
    } else {
      // Soft delete (mark as deleted)
      await Blog.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      logger.info('Blog soft deleted', { blogId: id });
    }

    ResponseHandler.deleted(res, 'Blog deleted successfully');
  } catch (error) {
    logger.error('Blog deletion error', {
      error: error.message,
      id: req.params.id,
    });
    next(error);
  }
});

/**
 * Search blogs with advanced filtering
 * GET /api/blogs/search?q=block-printed&category=Styling%20Tips&sort=-publishedAt
 *
 * @param {Object} req - Express request object
 * @param {string} req.query.q - Search query
 * @param {string} req.query.category - Filter by category
 * @param {string} req.query.tag - Filter by tag
 * @param {number} req.query.page - Page number
 * @param {number} req.query.limit - Items per page
 *
 * @returns {Object} Search results with pagination
 */
const searchBlogs = catchAsync(async (req, res, next) => {
  try {
    const { q = '', category, tag, page = 1, limit = 10, sort = '-publishedAt' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    if (!q.trim()) {
      return next(new AppError('Search query is required', StatusCodes.BAD_REQUEST));
    }

    const filter = {
      published: true,
      isDeleted: false,
      $text: { $search: q.trim() },
    };

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    const blogs = await Blog.find(filter)
      .sort({ score: { $meta: 'textScore' } })
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-content')
      .lean();

    const total = await Blog.countDocuments(filter);

    ResponseHandler.paginated(res, {
      data: blogs,
      page: pageNum,
      limit: limitNum,
      total,
      message: 'Search results retrieved successfully',
      meta: {
        query: q,
        hasMore: skip + blogs.length < total,
      },
    });
  } catch (error) {
    logger.error('Blog search error', {
      error: error.message,
      query: req.query.q,
    });
    next(error);
  }
});

/**
 * Get featured/trending blogs
 * GET /api/blogs/featured?limit=5
 *
 * @returns {Object} Array of featured blogs
 */
const getFeaturedBlogs = catchAsync(async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit) || 5));

    const blogs = await Blog.find({
      published: true,
      isDeleted: false,
    })
      .sort({ views: -1, publishedAt: -1 })
      .limit(limitNum)
      .select('-content')
      .lean();

    ResponseHandler.success(res, {
      data: blogs,
      message: 'Featured blogs retrieved successfully',
    });
  } catch (error) {
    logger.error('Get featured blogs error', { error: error.message });
    next(error);
  }
});

/**
 * Get blogs by category
 * GET /api/blogs/category/:category?page=1&limit=10
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.category - Blog category
 *
 * @returns {Object} Paginated blogs in the specified category
 */
const getBlogsByCategory = catchAsync(async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!category || category.trim() === '') {
      return next(new AppError('Category is required', StatusCodes.BAD_REQUEST));
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const blogs = await Blog.find({
      category: category,
      published: true,
      isDeleted: false,
    })
      .sort('-publishedAt')
      .skip(skip)
      .limit(limitNum)
      .select('-content')
      .lean();

    const total = await Blog.countDocuments({
      category: category,
      published: true,
      isDeleted: false,
    });

    ResponseHandler.paginated(res, {
      data: blogs,
      page: pageNum,
      limit: limitNum,
      total,
      message: `Blogs in ${category} retrieved successfully`,
    });
  } catch (error) {
    logger.error('Get blogs by category error', {
      error: error.message,
      category: req.params.category,
    });
    next(error);
  }
});

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  updateBlog,
  publishBlog,
  deleteBlog,
  searchBlogs,
  getFeaturedBlogs,
  getBlogsByCategory,
};
