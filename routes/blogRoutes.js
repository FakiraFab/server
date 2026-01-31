/**
 * Blog Routes
 * RESTful API endpoints for blog management
 */

const express = require('express');
const {
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
} = require('../controllers/blogController');

const router = express.Router();

/**
 * PUBLIC ROUTES (Available to all users)
 */

/**
 * Get featured/trending blogs
 * GET /api/blogs/featured
 * @query {number} limit - Number of featured blogs (default: 5, max: 20)
 */
router.get('/featured', getFeaturedBlogs);

/**
 * Get a blog by slug (SEO-friendly URL)
 * GET /api/blogs/slug/:slug
 * @param {string} slug - URL-friendly blog identifier
 * @example GET /api/blogs/slug/10-best-block-printed-saree-designs
 */
router.get('/slug/:slug', getBlogBySlug);

/**
 * Get blogs by category
 * GET /api/blogs/category/:category
 * @param {string} category - Blog category
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @example GET /api/blogs/category/Styling%20Tips?page=1&limit=10
 */
router.get('/category/:category', getBlogsByCategory);

/**
 * Search blogs
 * GET /api/blogs/search
 * @query {string} q - Search query (required)
 * @query {string} category - Filter by category (optional)
 * @query {string} tag - Filter by tag (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @example GET /api/blogs/search?q=block-printed&page=1
 */
router.get('/search', searchBlogs);

/**
 * Get all blogs with pagination and filtering
 * GET /api/blogs
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {boolean} published - Filter by published status (optional)
 * @query {string} category - Filter by category (optional)
 * @query {string} tag - Filter by tag (optional)
 * @query {string} sort - Sort field (default: -createdAt)
 * @query {string} search - Search query (optional)
 * @example GET /api/blogs?page=1&limit=10&published=true&category=Styling%20Tips
 */
router.get('/', getAllBlogs);

/**
 * ADMIN/PROTECTED ROUTES (Should be protected with authentication middleware)
 * Note: Add authentication middleware before these routes in main server file
 */

/**
 * Create a new blog post
 * POST /api/blogs
 * @body {Object} blog - Blog data
 * @body {string} blog.title - Blog title (required, 5-300 chars)
 * @body {string} blog.shortDescription - Short description (required, 20-500 chars)
 * @body {string} blog.content - Full blog content (required, min 100 chars)
 * @body {string} [blog.metaTitle] - SEO meta title (max 160 chars)
 * @body {string} [blog.metaDescription] - SEO meta description (max 160 chars)
 * @body {string[]} [blog.metaKeywords] - SEO keywords (max 10)
 * @body {string} [blog.image] - Blog banner image URL
 * @body {string} [blog.author] - Author name (default: "FakiraFab")
 * @body {string} [blog.category] - Blog category
 * @body {string[]} [blog.tags] - Blog tags
 * @body {boolean} [blog.published] - Publish status (default: false)
 */
router.post('/', createBlog);

/**
 * Get a blog by ID (admin view - can see unpublished blogs)
 * GET /api/blogs/:id
 * @param {string} id - MongoDB blog ID
 * @example GET /api/blogs/507f1f77bcf86cd799439011
 */
router.get('/:id', getBlogById);

/**
 * Update a blog post
 * PUT /api/blogs/:id
 * @param {string} id - MongoDB blog ID
 * @body {Object} updates - Fields to update (all optional)
 */
router.put('/:id', updateBlog);

/**
 * Toggle publish status of a blog
 * PATCH /api/blogs/:id/publish
 * @param {string} id - MongoDB blog ID
 * @body {boolean} published - New publish status
 * @example PATCH /api/blogs/507f1f77bcf86cd799439011/publish
 *          Body: { "published": true }
 */
router.patch('/:id/publish', publishBlog);

/**
 * Delete a blog post
 * DELETE /api/blogs/:id
 * @param {string} id - MongoDB blog ID
 * @query {boolean} permanent - If true, performs hard delete (default: false - soft delete)
 * @example DELETE /api/blogs/507f1f77bcf86cd799439011
 *          DELETE /api/blogs/507f1f77bcf86cd799439011?permanent=true
 */
router.delete('/:id', deleteBlog);

module.exports = router;
