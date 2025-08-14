const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const validateParams = require('../middleware/validateParams');
const { getProducts, createProduct, updateProduct, getProductById, deleteProduct, searchProducts, getSearchSuggestions } = require('../controllers/productController');

// Search routes - should come before the :id route to avoid conflicts
router.get('/search', searchProducts);
router.get('/search/suggestions', getSearchSuggestions);

router.get('/', getProducts);
 
router.get('/:id', validateParams(), getProductById);
router.post('/', createProduct);
router.patch('/:id', validateParams(), updateProduct);
router.delete('/:id', validateParams(), deleteProduct);

module.exports = router;