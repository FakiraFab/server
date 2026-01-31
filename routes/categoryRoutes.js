const express = require("express");
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const validateParams = require("../middleware/validateParams");
const { auth } = require("../middleware/auth");
const { cache } = require("../middleware/cache");
const { invalidateCacheMiddleware } = require("../utils/cacheInvalidation");
const router = express.Router();

// Public routes
router.get("/", cache({ prefix: 'categories', ttl: 21600, includeParams: ['page', 'limit', 'sort'] }), getCategories);
router.get("/:id", validateParams(), getCategoryById);

// Protected admin routes
router.post("/", auth, createCategory, invalidateCacheMiddleware('categories'));
router.patch("/:id", auth, validateParams(), updateCategory, invalidateCacheMiddleware('categories', (req) => ({ categoryId: req.params.id })));
router.delete("/:id", auth, validateParams(), deleteCategory, invalidateCacheMiddleware('categories', (req) => ({ categoryId: req.params.id })));

module.exports = router;
