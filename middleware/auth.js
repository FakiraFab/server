const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { AppError } = require('./errorHandler');
const { StatusCodes } = require('../utils/errorMessages');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware to require authentication
 * Extracts Bearer token, verifies JWT, finds user, checks if active
 */
const requireAuth = catchAsync(async (req, res, next) => {
  // Extract token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return next(new AppError('Authentication required. Please provide a valid token.', StatusCodes.UNAUTHORIZED));
  }

  // Verify JWT token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', StatusCodes.UNAUTHORIZED));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', StatusCodes.UNAUTHORIZED));
    }
    return next(new AppError('Authentication failed.', StatusCodes.UNAUTHORIZED));
  }

  // Find user by ID from token
  const user = await User.findById(decoded.id);
  
  if (!user) {
    return next(new AppError('User no longer exists.', StatusCodes.UNAUTHORIZED));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', StatusCodes.UNAUTHORIZED));
  }

  // Attach user to request object
  req.user = {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    isVerified: user.isVerified
  };

  next();
});

/**
 * Middleware to require admin role
 * Must be used after requireAuth middleware
 */
const requireAdmin = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', StatusCodes.UNAUTHORIZED));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Access forbidden. Admin privileges required.', StatusCodes.FORBIDDEN));
  }

  next();
});

/**
 * Optional authentication middleware
 * Attaches user if token is valid but doesn't fail if no token
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      };
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
});

// Keep backward compatibility with existing code
const auth = requireAuth;

module.exports = {
  auth,
  requireAuth,
  requireAdmin,
  optionalAuth
};
