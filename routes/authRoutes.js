const express = require('express');
const {
  signup,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
  getMe,
  sendOtp,
  verifyOtp
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);

// OTP routes (optional)
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// Protected routes (require authentication)
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
