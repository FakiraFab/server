const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const Cart = require('../models/cart');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const { StatusCodes } = require('../utils/errorMessages');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * GET /api/wishlist
 * Get user's wishlist with populated products
 */
exports.getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.find({ userId: req.user.id })
    .populate('productId')
    .sort({ addedAt: -1 })
    .lean();

  // Filter out items where product was deleted
  const filteredWishlist = wishlist.filter(item => item.productId);

  ResponseHandler.success(res, {
    data: filteredWishlist,
    message: 'Wishlist retrieved successfully'
  });
});

/**
 * POST /api/wishlist
 * Add product to wishlist
 */
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError('Product ID is required', StatusCodes.BAD_REQUEST));
  }

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', StatusCodes.NOT_FOUND));
  }

  // Check if already in wishlist
  const existingItem = await Wishlist.findOne({
    userId: req.user.id,
    productId
  });

  if (existingItem) {
    return next(new AppError('Product already in wishlist', StatusCodes.CONFLICT));
  }

  // Create wishlist item
  const wishlistItem = await Wishlist.create({
    userId: req.user.id,
    productId
  });

  // Populate product details
  const populatedItem = await Wishlist.findById(wishlistItem._id)
    .populate('productId');

  logger.info('Product added to wishlist', {
    userId: req.user.id,
    productId
  });

  ResponseHandler.created(res, populatedItem, 'Product added to wishlist successfully');
});

/**
 * DELETE /api/wishlist/:productId
 * Remove product from wishlist
 */
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const result = await Wishlist.findOneAndDelete({
    userId: req.user.id,
    productId
  });

  if (!result) {
    return next(new AppError('Product not found in wishlist', StatusCodes.NOT_FOUND));
  }

  logger.info('Product removed from wishlist', {
    userId: req.user.id,
    productId
  });

  ResponseHandler.deleted(res, 'Product removed from wishlist successfully');
});

/**
 * POST /api/wishlist/:productId/move-to-cart
 * Move product from wishlist to cart
 */
exports.moveToCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  // Validate product exists in wishlist
  const wishlistItem = await Wishlist.findOne({
    userId: req.user.id,
    productId
  });

  if (!wishlistItem) {
    return next(new AppError('Product not found in wishlist', StatusCodes.NOT_FOUND));
  }

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', StatusCodes.NOT_FOUND));
  }

  // Check stock availability
  if (product.quantity < 1) {
    return next(new AppError('Product is out of stock', StatusCodes.BAD_REQUEST));
  }

  // Find or create cart
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    cart = new Cart({ userId: req.user.id, items: [] });
  }

  // Add to cart with quantity 1
  await cart.addItem(productId, 1, null, product.price);

  // Remove from wishlist
  await Wishlist.findByIdAndDelete(wishlistItem._id);

  logger.info('Product moved from wishlist to cart', {
    userId: req.user.id,
    productId
  });

  ResponseHandler.success(res, {
    message: 'Product moved to cart successfully'
  });
});
