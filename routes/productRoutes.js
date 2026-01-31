const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const validateParams = require("../middleware/validateParams");
const { cache } = require("../middleware/cache");
const { invalidateCacheMiddleware } = require("../utils/cacheInvalidation");
const {
  getProducts,
  createProduct,
  updateProduct,
  getProductById,
  deleteProduct,
  searchProducts,
  getSearchSuggestions,
} = require("../controllers/productController");

// Public routes - Search routes should come before the :id route to avoid conflicts
router.get("/search", searchProducts);
router.get("/search/suggestions", getSearchSuggestions);
router.get("/", cache({ prefix: 'products', ttl: 1800, includeParams: ['category', 'subcategory', 'limit', 'page', 'sort', 'createdAt[gte]'] }), getProducts);
router.get("/:id", validateParams(), getProductById);

// Protected admin routes
router.post("/", auth, createProduct, invalidateCacheMiddleware('products', (req, res, data) => {
  // Extract category ID from the created product
  return { categoryId: data?.data?.category };
}));
router.patch("/:id", auth, validateParams(), updateProduct, invalidateCacheMiddleware('products', (req, res, data) => {
  // Extract category ID from the updated product
  return { categoryId: data?.data?.category };
}));
router.delete("/:id", auth, validateParams(), deleteProduct, invalidateCacheMiddleware('products'));

module.exports = router;
