const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validateParams = require('../middleware/validateParams');
const { getProducts, createProduct, updateProduct, getProductById, deleteProduct, searchProducts, getSearchSuggestions } = require('../controllers/productController');

// Public routes - Search routes should come before the :id route to avoid conflicts
router.get('/search', searchProducts);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/', getProducts);
router.get('/:id', validateParams(), getProductById);

// Protected admin routes
router.post('/', auth, createProduct);
router.patch('/:id', auth, validateParams(), updateProduct);
router.delete('/:id', auth, validateParams(), deleteProduct);

module.exports = router;