const Cart = require('../models/cart');
const Product = require('../models/product');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const { StatusCodes } = require('../utils/errorMessages');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * GET /api/cart
 * Get user's cart with populated products
 */
exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.productId')
    .lean();

  if (!cart) {
    // Return empty cart if not found
    return ResponseHandler.success(res, {
      data: {
        items: [],
        totalPrice: 0,
        totalItems: 0
      },
      message: 'Cart is empty'
    });
  }

  // Validate stock and calculate totals with current prices
  const enrichedItems = cart.items
    .filter(item => item.productId) // Filter out items where product was deleted
    .map(item => {
      const product = item.productId;
      const currentPrice = product.price; // Use base price or option price if needed
      const inStock = product.quantity >= item.quantity;

      return {
        ...item,
        product: {
          id: product._id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price
        },
        currentPrice,
        priceAtAdd: item.priceAtAdd,
        inStock,
        totalPrice: currentPrice * item.quantity
      };
    });

  const totalPrice = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

  ResponseHandler.success(res, {
    data: {
      items: enrichedItems,
      totalPrice,
      totalItems
    },
    message: 'Cart retrieved successfully'
  });
});

/**
 * POST /api/cart
 * Add item to cart
 */
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1, selectedOption } = req.body;

  if (!productId) {
    return next(new AppError('Product ID is required', StatusCodes.BAD_REQUEST));
  }

  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1', StatusCodes.BAD_REQUEST));
  }

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', StatusCodes.NOT_FOUND));
  }

  // Check stock availability
  if (product.quantity < quantity) {
    return next(new AppError('Insufficient stock available', StatusCodes.BAD_REQUEST));
  }

  // Get price (use option price if available, otherwise base price)
  let price = product.price;
  if (selectedOption && selectedOption.color) {
    const option = product.options.find(opt => opt.color === selectedOption.color);
    if (option && option.price) {
      price = option.price;
    }
  }

  // Find or create cart
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    cart = new Cart({ userId: req.user.id, items: [] });
  }

  // Add item to cart using instance method
  await cart.addItem(productId, quantity, selectedOption, price);

  // Populate and return cart
  cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.productId');

  logger.info('Item added to cart', {
    userId: req.user.id,
    productId,
    quantity
  });

  ResponseHandler.success(res, {
    data: cart,
    message: 'Item added to cart successfully'
  });
});

/**
 * PATCH /api/cart/items/:productId
 * Update item quantity in cart
 */
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity, selectedOption } = req.body;

  if (quantity === undefined) {
    return next(new AppError('Quantity is required', StatusCodes.BAD_REQUEST));
  }

  if (quantity < 0) {
    return next(new AppError('Quantity cannot be negative', StatusCodes.BAD_REQUEST));
  }

  // Find cart
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', StatusCodes.NOT_FOUND));
  }

  // If quantity is 0, remove item
  if (quantity === 0) {
    await cart.removeItem(productId, selectedOption);
  } else {
    // Validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', StatusCodes.NOT_FOUND));
    }

    if (product.quantity < quantity) {
      return next(new AppError('Insufficient stock available', StatusCodes.BAD_REQUEST));
    }

    // Update quantity
    await cart.updateItemQuantity(productId, quantity, selectedOption);
  }

  // Populate and return cart
  cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.productId');

  logger.info('Cart item updated', {
    userId: req.user.id,
    productId,
    quantity
  });

  ResponseHandler.success(res, {
    data: cart,
    message: 'Cart updated successfully'
  });
});

/**
 * DELETE /api/cart/items/:productId
 * Remove item from cart
 */
exports.removeCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { selectedOption } = req.body;

  // Find cart
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', StatusCodes.NOT_FOUND));
  }

  // Remove item
  await cart.removeItem(productId, selectedOption);

  // Populate and return cart
  cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.productId');

  logger.info('Item removed from cart', {
    userId: req.user.id,
    productId
  });

  ResponseHandler.success(res, {
    data: cart,
    message: 'Item removed from cart successfully'
  });
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
exports.clearCart = catchAsync(async (req, res, next) => {
  // Find cart
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return ResponseHandler.success(res, {
      message: 'Cart is already empty'
    });
  }

  // Clear cart
  await cart.clearCart();

  logger.info('Cart cleared', { userId: req.user.id });

  ResponseHandler.success(res, {
    data: {
      items: [],
      totalPrice: 0,
      totalItems: 0
    },
    message: 'Cart cleared successfully'
  });
});
