const express = require('express');
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { handleRazorpayWebhook, handleShiprocketWebhook } = require('../controllers/webhookController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validateParams = require('../middleware/validateParams');

const router = express.Router();

// Webhook routes (no authentication, signature verified in controller)
router.post('/webhooks/razorpay', handleRazorpayWebhook);
router.post('/webhooks/shiprocket', handleShiprocketWebhook);

// User order routes (require authentication)
router.post('/create', requireAuth, createOrder);
router.post('/verify-payment', requireAuth, verifyPayment);
router.get('/', requireAuth, getUserOrders);
router.get('/:id', requireAuth, validateParams(), getOrderById);
router.post('/:id/cancel', requireAuth, validateParams(), cancelOrder);

// Admin order routes (require admin privileges)
router.get('/admin/all', requireAuth, requireAdmin, getAllOrders);
router.patch('/admin/:id/status', requireAuth, requireAdmin, validateParams(), updateOrderStatus);

module.exports = router;
