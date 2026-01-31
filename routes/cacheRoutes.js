const express = require('express');
const router = express.Router();
const { isRedisAvailable, getCacheStats, clearAllCache } = require('../config/redis');
const { invalidateCache } = require('../utils/cacheInvalidation');
const { warmCriticalCaches } = require('../utils/cacheWarming');
const { auth } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Health check endpoint for Redis
 * GET /api/cache/health
 */
router.get('/health', catchAsync(async (req, res) => {
  const isAvailable = isRedisAvailable();
  const stats = await getCacheStats();

  responseHandler.success(res, {
    data: {
      redis: {
        connected: isAvailable,
        ...stats,
      },
    },
    message: isAvailable ? 'Redis is healthy' : 'Redis is not available',
  });
}));

/**
 * Get cache statistics
 * GET /api/cache/stats
 */
router.get('/stats', auth, catchAsync(async (req, res) => {
  const stats = await getCacheStats();

  responseHandler.success(res, {
    data: stats,
    message: 'Cache statistics retrieved successfully',
  });
}));

/**
 * Flush all cache
 * POST /api/cache/flush
 */
router.post('/flush', auth, catchAsync(async (req, res) => {
  const result = await clearAllCache();

  if (result) {
    responseHandler.success(res, {
      message: 'All cache cleared successfully',
    });
  } else {
    responseHandler.error(res, 'Failed to clear cache', 500);
  }
}));

/**
 * Invalidate specific resource cache
 * POST /api/cache/invalidate/:resourceType
 * Body: { categoryId: 'optional' } for products/categories
 */
router.post('/invalidate/:resourceType', auth, catchAsync(async (req, res) => {
  const { resourceType } = req.params;
  const options = req.body || {};

  const validTypes = ['banners', 'categories', 'products', 'reels'];
  
  if (!validTypes.includes(resourceType)) {
    return responseHandler.error(res, `Invalid resource type. Must be one of: ${validTypes.join(', ')}`, 400);
  }

  const result = await invalidateCache(resourceType, options);

  if (result) {
    responseHandler.success(res, {
      message: `Cache for ${resourceType} invalidated successfully`,
    });
  } else {
    responseHandler.error(res, `Failed to invalidate ${resourceType} cache`, 500);
  }
}));

/**
 * Warm critical caches
 * POST /api/cache/warm
 */
router.post('/warm', auth, catchAsync(async (req, res) => {
  // Run cache warming asynchronously
  warmCriticalCaches().catch(err => {
    logger.error('Cache warming error', { error: err.message, stack: err.stack });
  });

  responseHandler.success(res, {
    message: 'Cache warming initiated in background',
  });
}));

module.exports = router;
