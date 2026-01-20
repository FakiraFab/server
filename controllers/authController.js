const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const { StatusCodes } = require('../utils/errorMessages');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  sendOtpSchema,
  verifyOtpSchema
} = require('../schemas/authSchemas');

// Helper function to generate JWT tokens
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/signup
 * Register a new user
 */
exports.signup = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = signupSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { email, password, name, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', StatusCodes.CONFLICT));
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    name,
    phone
  });

  // Generate email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  // await emailService.sendEmailVerificationEmail(user, verificationToken);

  // Generate JWT tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  user.addRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  logger.info('User registered successfully', {
    userId: user._id,
    email: user.email
  });

  // Return response
  ResponseHandler.created(res, {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified
    },
    tokens: {
      accessToken,
      refreshToken
    }
  }, 'User registered successfully. Please verify your email.');
});

/**
 * POST /api/auth/login
 * Login existing user
 */
exports.login = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { email, password } = req.body;

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return next(new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED));
  }

  // Check if password is correct
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', StatusCodes.UNAUTHORIZED));
  }

  // Generate JWT tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  user.addRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in successfully', {
    userId: user._id,
    email: user.email
  });

  // Return response
  ResponseHandler.success(res, {
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken,
        refreshToken
      }
    },
    message: 'Login successful'
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
exports.refresh = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = refreshTokenSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { refreshToken } = req.body;

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED));
  }

  // Find user
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('User not found', StatusCodes.UNAUTHORIZED));
  }

  // Check if refresh token exists in database
  const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
  if (!tokenExists) {
    return next(new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED));
  }

  // Generate new access token
  const accessToken = generateAccessToken(user._id);

  logger.info('Access token refreshed', { userId: user._id });

  // Return response
  ResponseHandler.success(res, {
    data: {
      accessToken
    },
    message: 'Token refreshed successfully'
  });
});

/**
 * POST /api/auth/forgot-password
 * Send password reset token to user's email
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = forgotPasswordSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not
    return ResponseHandler.success(res, {
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  }

  // Generate password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // TODO: Send password reset email
  // await emailService.sendPasswordResetEmail(user, resetToken);

  logger.info('Password reset token generated', {
    userId: user._id,
    email: user.email
  });

  // Return response
  ResponseHandler.success(res, {
    message: 'If an account exists with this email, a password reset link has been sent.'
  });
});

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { token, password } = req.body;

  // Hash the token from request
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token and not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token', StatusCodes.BAD_REQUEST));
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  // Invalidate all refresh tokens for security
  user.refreshTokens = [];
  
  await user.save();

  logger.info('Password reset successful', {
    userId: user._id,
    email: user.email
  });

  // Return response
  ResponseHandler.success(res, {
    message: 'Password reset successful. Please log in with your new password.'
  });
});

/**
 * POST /api/auth/verify-email
 * Verify user's email using token
 */
exports.verifyEmail = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = verifyEmailSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { token } = req.body;

  // Hash the token from request
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token and not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification token', StatusCodes.BAD_REQUEST));
  }

  // Set user as verified
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  logger.info('Email verified successfully', {
    userId: user._id,
    email: user.email
  });

  // Return response
  ResponseHandler.success(res, {
    message: 'Email verified successfully'
  });
});

/**
 * POST /api/auth/logout
 * Logout user by removing refresh token
 */
exports.logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', StatusCodes.BAD_REQUEST));
  }

  // Find user and remove refresh token
  const user = await User.findById(req.user.id);
  if (user) {
    user.removeRefreshToken(refreshToken);
    await user.save({ validateBeforeSave: false });
  }

  logger.info('User logged out', { userId: req.user.id });

  // Return response
  ResponseHandler.success(res, {
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Get current user's profile
 */
exports.getMe = catchAsync(async (req, res, next) => {
  // Find user by ID
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new AppError('User not found', StatusCodes.NOT_FOUND));
  }

  // Return response
  ResponseHandler.success(res, {
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt
    },
    message: 'User profile retrieved successfully'
  });
});

/**
 * POST /api/auth/otp/send
 * Send OTP to user's phone
 */
exports.sendOtp = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = sendOtpSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { phone } = req.body;

  // Find or create user by phone
  let user = await User.findOne({ phone });
  
  if (!user) {
    return next(new AppError('User with this phone number not found. Please register first.', StatusCodes.NOT_FOUND));
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and save to user
  user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // TODO: Send OTP via SMS
  // await smsService.sendOTP(phone, otp);

  logger.info('OTP sent to phone', { phone, userId: user._id });

  // Return response
  ResponseHandler.success(res, {
    message: 'OTP sent successfully to your phone'
  });
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP and login user
 */
exports.verifyOtp = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = verifyOtpSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { phone, otp } = req.body;

  // Hash the provided OTP
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  // Find user with matching phone, OTP hash, and not expired
  const user = await User.findOne({
    phone,
    otpHash: hashedOtp,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired OTP', StatusCodes.BAD_REQUEST));
  }

  // Clear OTP fields
  user.otpHash = undefined;
  user.otpExpires = undefined;
  
  // Mark phone as verified
  user.isVerified = true;
  
  await user.save({ validateBeforeSave: false });

  // Generate JWT tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  user.addRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  logger.info('OTP verified and user logged in', {
    userId: user._id,
    phone: user.phone
  });

  // Return response
  ResponseHandler.success(res, {
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken,
        refreshToken
      }
    },
    message: 'OTP verified successfully'
  });
});
