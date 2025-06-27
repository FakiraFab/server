const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const validateParams = require('../middleware/validateParams');
const { getProducts, createProduct, updateProduct, getProductById, deleteProduct } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/:id', validateParams(), getProductById);
router.post('/', createProduct);
router.put('/:id', validateParams(), updateProduct);
router.delete('/:id', validateParams(), deleteProduct);

module.exports = router;