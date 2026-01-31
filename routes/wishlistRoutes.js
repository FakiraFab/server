const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
} = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/auth');
const validateParams = require('../middleware/validateParams');

const router = express.Router();

// All wishlist routes require authentication
router.use(requireAuth);

// Wishlist operations
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', validateParams(), removeFromWishlist);

// Move wishlist item to cart
router.post('/:productId/move-to-cart', validateParams(), moveToCart);

module.exports = router;
