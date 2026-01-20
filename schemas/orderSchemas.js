const Joi = require('joi');

const createOrderSchema = Joi.object({
  shippingAddressId: Joi.string()
    .required()
    .messages({
      'any.required': 'Shipping address ID is required'
    }),
  billingAddressId: Joi.string()
    .optional(),
  paymentMethod: Joi.string()
    .valid('razorpay', 'cod')
    .default('razorpay')
    .messages({
      'any.only': 'Payment method must be either razorpay or cod'
    }),
  couponCode: Joi.string()
    .optional()
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Razorpay order ID is required'
    }),
  razorpay_payment_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Razorpay payment ID is required'
    }),
  razorpay_signature: Joi.string()
    .required()
    .messages({
      'any.required': 'Razorpay signature is required'
    })
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.only': 'Status must be one of: confirmed, processing, shipped, delivered, cancelled',
      'any.required': 'Status is required'
    }),
  note: Joi.string()
    .optional()
    .max(500)
    .messages({
      'string.max': 'Note cannot exceed 500 characters'
    }),
  trackingNumber: Joi.string()
    .optional(),
  shippingProvider: Joi.string()
    .optional()
});

const cancelOrderSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Reason must be at least 10 characters',
      'string.max': 'Reason cannot exceed 500 characters',
      'any.required': 'Cancellation reason is required'
    })
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
};
