const Order = require("../models/order");
const Payment = require("../models/payment");
const catchAsync = require("../utils/catchAsync");
const { AppError } = require("../middleware/errorHandler");
const { StatusCodes } = require("../utils/errorMessages");
const logger = require("../utils/logger");
const crypto = require("crypto");

/**
 * POST /api/webhooks/shiprocket
 * Handle Shiprocket webhook events
 */
handleShiprocketWebhook = catchAsync(async (req, res, next) => {
  const payload = req.body;

  logger.info("Shiprocket webhook received", {
    awb: payload.awb,
    status: payload.current_status,
    orderId: payload.order_id
  });

  try {
    // Find order by AWB code or Shiprocket order ID
    let order = null;
    
    if (payload.awb) {
      order = await Order.findOne({ 'shipping.awbCode': payload.awb });
    }
    
    if (!order && payload.order_id) {
      order = await Order.findOne({ 'shipping.shiprocketOrderId': payload.order_id });
    }

    if (!order) {
      logger.warn("Order not found for Shiprocket webhook", {
        awb: payload.awb,
        orderId: payload.order_id
      });
      return res.status(200).json({ status: "ok", message: "Order not found" });
    }

    // Map Shiprocket status to internal status
    const statusMapping = {
      'PICKED UP': { shipping: 'picked', order: 'processing' },
      'PICKUP SCHEDULED': { shipping: 'picked', order: 'processing' },
      'IN TRANSIT': { shipping: 'in_transit', order: 'shipped' },
      'OUT FOR DELIVERY': { shipping: 'in_transit', order: 'shipped' },
      'DELIVERED': { shipping: 'delivered', order: 'delivered' },
      'RTO': { shipping: 'rto', order: 'returned' },
      'RTO DELIVERED': { shipping: 'rto', order: 'returned' },
      'CANCELLED': { shipping: 'cancelled', order: 'cancelled' }
    };

    const currentStatus = payload.current_status?.toUpperCase().trim();
    const mappedStatus = statusMapping[currentStatus];

    if (!mappedStatus) {
      logger.warn("Unmapped Shiprocket status", {
        status: currentStatus,
        orderId: order.orderNumber
      });
      return res.status(200).json({ status: "ok", message: "Status not mapped" });
    }

    // Check if order status transition is valid
    // Don't update to delivered/returned if already cancelled by user
    const currentOrderStatus = order.orderStatus;
    if ((currentOrderStatus === 'cancelled' || currentOrderStatus === 'returned') && 
        (mappedStatus.order === 'delivered')) {
      logger.warn("Invalid status transition - order already cancelled/returned", {
        orderNumber: order.orderNumber,
        currentStatus: currentOrderStatus,
        attemptedStatus: mappedStatus.order
      });
      return res.status(200).json({ status: "ok", message: "Invalid status transition" });
    }

    // Update order shipping status
    if (!order.shipping) {
      order.shipping = {};
    }
    order.shipping.status = mappedStatus.shipping;

    // Update AWB code if provided and not already set
    if (payload.awb && !order.shipping.awbCode) {
      order.shipping.awbCode = payload.awb;
      
      // Check if trackingNumber already exists and log warning if different
      if (order.trackingNumber && order.trackingNumber !== payload.awb) {
        logger.warn("Tracking number mismatch", {
          orderNumber: order.orderNumber,
          existingTrackingNumber: order.trackingNumber,
          newAwbCode: payload.awb
        });
      }
      
      order.trackingNumber = payload.awb;
    }

    // Update courier information if provided
    if (payload.courier_name && !order.shipping.courierName) {
      order.shipping.courierName = payload.courier_name;
      order.shippingProvider = payload.courier_name;
    }

    // Update order status based on shipment status
    const oldOrderStatus = order.orderStatus;
    order.orderStatus = mappedStatus.order;

    // Set delivered date if delivered
    if (mappedStatus.order === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = Date.now();
    }

    // Add status history
    order.addStatusHistory(
      mappedStatus.order,
      `Shiprocket webhook: ${currentStatus}`
    );

    await order.save();

    logger.info("Order updated from Shiprocket webhook", {
      orderNumber: order.orderNumber,
      oldStatus: oldOrderStatus,
      newStatus: order.orderStatus,
      shippingStatus: order.shipping.status
    });

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error("Error processing Shiprocket webhook", {
      error: error.message,
      payload
    });
    return res.status(500).json({ status: "error", message: "Internal error" });
  }
});

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events
 */
handleRazorpayWebhook = catchAsync(async (req, res, next) => {
  // Verify webhook signature
  const webhookSignature = req.headers["x-razorpay-signature"];

  if (!webhookSignature) {
    logger.error("Razorpay webhook: Missing signature");
    return res
      .status(400)
      .json({ status: "error", message: "Missing signature" });
  }

  // Generate expected signature
  const webhookBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest("hex");

  // Compare signatures
  if (webhookSignature !== expectedSignature) {
    logger.error("Razorpay webhook: Invalid signature");
    return res
      .status(400)
      .json({ status: "error", message: "Invalid signature" });
  }

  // Process webhook event
  const event = req.body.event;
  const payload = req.body.payload;

  logger.info("Razorpay webhook received", { event });

  try {
    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload);
        break;

      case "refund.created":
        await handleRefundCreated(payload);
        break;

      default:
        logger.info("Unhandled webhook event", { event });
    }

    // Return success response
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error("Error processing webhook", {
      event,
      error: error.message,
    });
    return res.status(500).json({ status: "error", message: "Internal error" });
  }
});

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payload) {
  const paymentEntity = payload.payment.entity;
  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;

  logger.info("Processing payment.captured", {
    razorpayOrderId,
    razorpayPaymentId,
  });

  // Find order
  const order = await Order.findOne({ razorpayOrderId });
  if (!order) {
    logger.error("Order not found for captured payment", { razorpayOrderId });
    return;
  }

  // Check if payment already processed
  if (order.paymentStatus === "paid") {
    logger.info("Payment already processed for order", {
      orderNumber: order.orderNumber,
    });
    return;
  }

  // Find or create payment record
  let payment = await Payment.findOne({ providerPaymentId: razorpayPaymentId });

  if (!payment) {
    payment = await Payment.create({
      orderId: order._id,
      userId: order.userId,
      provider: "razorpay",
      providerPaymentId: razorpayPaymentId,
      providerOrderId: razorpayOrderId,
      amount: order.totalAmount,
      currency: order.currency,
      status: "captured",
      method: paymentEntity.method,
      email: paymentEntity.email,
      contact: paymentEntity.contact,
    });
  } else {
    payment.status = "captured";
    await payment.save();
  }

  // Update order
  order.paymentStatus = "paid";
  order.paymentId = payment._id;
  order.orderStatus = "confirmed";
  order.addStatusHistory("confirmed", "Payment captured via webhook");
  await order.save();

  logger.info("Payment captured and order confirmed", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    paymentId: payment._id,
  });
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload) {
  const paymentEntity = payload.payment.entity;
  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;

  logger.info("Processing payment.failed", {
    razorpayOrderId,
    razorpayPaymentId,
  });

  // Find order
  const order = await Order.findOne({ razorpayOrderId });
  if (!order) {
    logger.error("Order not found for failed payment", { razorpayOrderId });
    return;
  }

  // Update order payment status
  order.paymentStatus = "failed";
  order.addStatusHistory(
    "payment_failed",
    paymentEntity.error_description || "Payment failed",
  );
  await order.save();

  // Create or update payment record
  let payment = await Payment.findOne({ providerPaymentId: razorpayPaymentId });

  if (!payment) {
    payment = await Payment.create({
      orderId: order._id,
      userId: order.userId,
      provider: "razorpay",
      providerPaymentId: razorpayPaymentId,
      providerOrderId: razorpayOrderId,
      amount: order.totalAmount,
      currency: order.currency,
      status: "failed",
      failureReason: paymentEntity.error_description || "Payment failed",
    });
  } else {
    payment.status = "failed";
    payment.failureReason = paymentEntity.error_description || "Payment failed";
    await payment.save();
  }

  logger.info("Payment failed", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    reason: paymentEntity.error_description,
  });
}

/**
 * Handle refund.created event
 */
async function handleRefundCreated(payload) {
  const refundEntity = payload.refund.entity;
  const razorpayPaymentId = refundEntity.payment_id;

  logger.info("Processing refund.created", {
    razorpayPaymentId,
    refundId: refundEntity.id,
  });

  // Find payment
  const payment = await Payment.findOne({
    providerPaymentId: razorpayPaymentId,
  });
  if (!payment) {
    logger.error("Payment not found for refund", { razorpayPaymentId });
    return;
  }

  // Update payment with refund info
  payment.status = "refunded";
  payment.refundAmount = refundEntity.amount / 100; // Convert paise to rupees
  payment.refundedAt = Date.now();
  await payment.save();

  // Update order
  const order = await Order.findById(payment.orderId);
  if (order) {
    order.paymentStatus = "refunded";
    order.addStatusHistory(
      "refunded",
      `Refund of ₹${payment.refundAmount} processed`,
    );
    await order.save();
  }

  logger.info("Refund processed", {
    orderId: order?._id,
    orderNumber: order?.orderNumber,
    refundAmount: payment.refundAmount,
  });
}

module.exports = {
  handleRazorpayWebhook,
  handleShiprocketWebhook,
};
