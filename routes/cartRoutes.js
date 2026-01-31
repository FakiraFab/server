const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');
const validateParams = require('../middleware/validateParams');

const router = express.Router();

// All cart routes require authentication
router.use(requireAuth);

// Cart operations
router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);

// Cart item operations
router.patch('/items/:productId', validateParams(), updateCartItem);
router.delete('/items/:productId', validateParams(), removeCartItem);

module.exports = router;
