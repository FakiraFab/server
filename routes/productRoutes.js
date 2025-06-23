


const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

router.get('/', getAllProducts);
router.get('/:id', getAllProducts); // Assuming this is for getting a single product by ID
router.post('/', auth, validate, createProduct);
router.put('/:id', auth, validate, updateProduct);
router.delete('/:id', auth, deleteProduct);
