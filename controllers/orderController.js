const Order = require('../models/order');
const Payment = require('../models/payment');
const Cart = require('../models/cart');
const Address = require('../models/address');
const Product = require('../models/product');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const { StatusCodes } = require('../utils/errorMessages');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const {
  createOrderSchema,
  verifyPaymentSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
} = require('../schemas/orderSchemas');

/**
 * POST /api/orders/create
 * Create a new order from cart
 */
exports.createOrder = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = createOrderSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { shippingAddressId, billingAddressId, paymentMethod, couponCode } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Cart is empty', StatusCodes.BAD_REQUEST));
  }

  // Validate stock and prices for all items
  for (const item of cart.items) {
    if (!item.productId) {
      return next(new AppError('One or more products no longer exist', StatusCodes.BAD_REQUEST));
    }

    const product = item.productId;
    
    // Check stock availability
    if (product.quantity < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}`, StatusCodes.BAD_REQUEST));
    }
  }

  // Get shipping address
  const shippingAddress = await Address.findOne({
    _id: shippingAddressId,
    userId: req.user.id
  });

  if (!shippingAddress) {
    return next(new AppError('Shipping address not found', StatusCodes.NOT_FOUND));
  }

  // Get billing address (use shipping if not provided)
  let billingAddress = shippingAddress;
  if (billingAddressId) {
    billingAddress = await Address.findOne({
      _id: billingAddressId,
      userId: req.user.id
    });
    
    if (!billingAddress) {
      return next(new AppError('Billing address not found', StatusCodes.NOT_FOUND));
    }
  }

  // Create order items from cart
  const orderItems = cart.items.map(item => ({
    productId: item.productId._id,
    productName: item.productId.name,
    selectedOption: item.selectedOption,
    quantity: item.quantity,
    unitPrice: item.productId.price,
    totalPrice: item.productId.price * item.quantity
  }));

  // Create order object
  const order = new Order({
    userId: req.user.id,
    items: orderItems,
    shippingAddress: {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country,
      postalCode: shippingAddress.postalCode,
      addressType: shippingAddress.addressType
    },
    billingAddress: {
      fullName: billingAddress.fullName,
      phone: billingAddress.phone,
      addressLine1: billingAddress.addressLine1,
      addressLine2: billingAddress.addressLine2,
      city: billingAddress.city,
      state: billingAddress.state,
      country: billingAddress.country,
      postalCode: billingAddress.postalCode,
      addressType: billingAddress.addressType
    },
    paymentMethod,
    shippingCharges: 50, // Fixed shipping charges (can be calculated based on location)
    discount: 0, // Apply coupon discount here if needed
    statusHistory: [{
      status: 'pending',
      timestamp: Date.now(),
      note: 'Order created'
    }]
  });

  // Calculate totals
  order.calculateTotals();

  // Save order
  await order.save();

  // If payment method is Razorpay, create Razorpay order
  if (paymentMethod === 'razorpay') {
    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: order.totalAmount * 100, // Amount in paise
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order._id.toString(),
          userId: req.user.id.toString()
        }
      });

      // Save Razorpay order ID
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      logger.info('Order created with Razorpay', {
        userId: req.user.id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id
      });

      // Clear cart after successful order creation
      await cart.clearCart();

      // Return order with Razorpay details
      return ResponseHandler.created(res, {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          currency: order.currency
        },
        razorpay: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID
        }
      }, 'Order created successfully. Please complete payment.');
    } catch (err) {
      // Delete order if Razorpay order creation fails
      await Order.findByIdAndDelete(order._id);
      logger.error('Razorpay order creation failed', {
        error: err.message,
        userId: req.user.id
      });
      return next(new AppError('Failed to create payment order. Please try again.', StatusCodes.INTERNAL_SERVER));
    }
  }

  // For COD, mark order as confirmed
  if (paymentMethod === 'cod') {
    order.orderStatus = 'confirmed';
    order.paymentStatus = 'pending';
    order.addStatusHistory('confirmed', 'COD order confirmed');
    await order.save();

    // Clear cart
    await cart.clearCart();

    logger.info('COD order created', {
      userId: req.user.id,
      orderId: order._id,
      orderNumber: order.orderNumber
    });

    return ResponseHandler.created(res, {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: 'cod',
        orderStatus: order.orderStatus
      }
    }, 'Order placed successfully with Cash on Delivery');
  }
});

/**
 * POST /api/orders/verify-payment
 * Verify Razorpay payment and update order
 */
exports.verifyPayment = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = verifyPaymentSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Find order by razorpayOrderId
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) {
    return next(new AppError('Order not found', StatusCodes.NOT_FOUND));
  }

  // Verify user owns this order
  if (order.userId.toString() !== req.user.id.toString()) {
    return next(new AppError('Unauthorized access to order', StatusCodes.FORBIDDEN));
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    // Invalid signature - mark payment as failed
    order.paymentStatus = 'failed';
    order.addStatusHistory('payment_failed', 'Payment verification failed');
    await order.save();

    logger.error('Payment verification failed - invalid signature', {
      orderId: order._id,
      orderNumber: order.orderNumber
    });

    return next(new AppError('Payment verification failed', StatusCodes.BAD_REQUEST));
  }

  // Fetch payment details from Razorpay
  try {
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    // Create payment record
    const payment = await Payment.create({
      orderId: order._id,
      userId: req.user.id,
      provider: 'razorpay',
      providerPaymentId: razorpay_payment_id,
      providerOrderId: razorpay_order_id,
      providerSignature: razorpay_signature,
      amount: order.totalAmount,
      currency: order.currency,
      status: 'captured',
      method: razorpayPayment.method,
      email: razorpayPayment.email,
      contact: razorpayPayment.contact
    });

    // Update order
    order.paymentStatus = 'paid';
    order.paymentId = payment._id;
    order.orderStatus = 'confirmed';
    order.addStatusHistory('confirmed', 'Payment successful, order confirmed');
    await order.save();

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }

    logger.info('Payment verified and order confirmed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentId: payment._id
    });

    // TODO: Send confirmation email/SMS
    // await emailService.sendOrderConfirmationEmail(order, req.user);

    return ResponseHandler.success(res, {
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount
      },
      message: 'Payment verified successfully. Your order is confirmed!'
    });
  } catch (err) {
    logger.error('Error fetching payment from Razorpay', {
      error: err.message,
      paymentId: razorpay_payment_id
    });
    return next(new AppError('Failed to verify payment. Please contact support.', StatusCodes.INTERNAL_SERVER));
  }
});

/**
 * GET /api/orders
 * Get user's orders (paginated)
 */
exports.getUserOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { userId: req.user.id };
  if (status) {
    filter.orderStatus = status;
  }

  // Get orders
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(filter);

  ResponseHandler.paginated(res, {
    data: orders,
    page,
    limit,
    total,
    message: 'Orders retrieved successfully'
  });
});

/**
 * GET /api/orders/:id
 * Get specific order by ID
 */
exports.getOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    userId: req.user.id
  })
    .populate('items.productId')
    .lean();

  if (!order) {
    return next(new AppError('Order not found', StatusCodes.NOT_FOUND));
  }

  ResponseHandler.success(res, {
    data: order,
    message: 'Order retrieved successfully'
  });
});

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
exports.cancelOrder = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = cancelOrderSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { id } = req.params;
  const { reason } = req.body;

  // Find order
  const order = await Order.findOne({
    _id: id,
    userId: req.user.id
  });

  if (!order) {
    return next(new AppError('Order not found', StatusCodes.NOT_FOUND));
  }

  // Check if order can be cancelled
  if (!order.canCancel()) {
    return next(new AppError('Order cannot be cancelled in current status', StatusCodes.BAD_REQUEST));
  }

  // Cancel order
  order.cancelOrder(reason);
  await order.save();

  // If payment was made, initiate refund
  if (order.paymentStatus === 'paid' && order.paymentId) {
    // TODO: Initiate refund with Razorpay
    logger.info('Refund to be initiated for cancelled order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentId: order.paymentId
    });
  }

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { quantity: item.quantity }
    });
  }

  logger.info('Order cancelled', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    reason
  });

  ResponseHandler.success(res, {
    data: order,
    message: 'Order cancelled successfully'
  });
});

/**
 * GET /api/orders/admin/all
 * Get all orders (admin only) - paginated with filters
 */
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    orderNumber,
    startDate,
    endDate
  } = req.query;

  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (status) filter.orderStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  // Get orders
  const orders = await Order.find(filter)
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(filter);

  ResponseHandler.paginated(res, {
    data: orders,
    page,
    limit,
    total,
    message: 'Orders retrieved successfully'
  });
});

/**
 * PATCH /api/orders/admin/:id/status
 * Update order status (admin only)
 */
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = updateOrderStatusSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { id } = req.params;
  const { status, note, trackingNumber, shippingProvider } = req.body;

  // Find order
  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('Order not found', StatusCodes.NOT_FOUND));
  }

  // Update order status
  order.orderStatus = status;
  order.addStatusHistory(status, note || `Order status updated to ${status}`);

  // Update tracking info if provided
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (shippingProvider) order.shippingProvider = shippingProvider;

  // Set estimated delivery if shipped
  if (status === 'shipped' && !order.estimatedDelivery) {
    order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  }

  // Set delivered date if delivered
  if (status === 'delivered') {
    order.deliveredAt = Date.now();
  }

  await order.save();

  logger.info('Order status updated by admin', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    newStatus: status,
    adminId: req.user.id
  });

  // TODO: Send notification to customer
  // await emailService.sendOrderStatusUpdateEmail(order);

  ResponseHandler.success(res, {
    data: order,
    message: 'Order status updated successfully'
  });
});
