const { deleteCache, deleteCachePattern } = require('../config/redis');
const logger = require('../utils/logger');
const { CACHE_VERSION } = require('../middleware/cache');

/**
 * Cache invalidation utilities for different resources
 */

/**
 * Invalidate banner caches
 */
const invalidateBannerCache = async () => {
  try {
    logger.info('Invalidating banner cache');
    // Delete all banner-related cache keys
    await deleteCachePattern(`banners:*:${CACHE_VERSION}`);
    return true;
  } catch (error) {
    logger.error('Error invalidating banner cache', { error: error.message });
    return false;
  }
};

/**
 * Invalidate category caches
 * @param {string} categoryId - Optional category ID for specific invalidation
 */
const invalidateCategoryCache = async (categoryId = null) => {
  try {
    logger.info('Invalidating category cache', { categoryId });
    
    // Delete category list cache
    await deleteCachePattern(`categories:*:${CACHE_VERSION}`);
    
    // If specific category, also invalidate related product caches
    if (categoryId) {
      await deleteCachePattern(`products:category:${categoryId}:*:${CACHE_VERSION}`);
    }
    
    return true;
  } catch (error) {
    logger.error('Error invalidating category cache', { error: error.message });
    return false;
  }
};

/**
 * Invalidate product caches
 * @param {string} categoryId - Optional category ID for specific invalidation
 */
const invalidateProductCache = async (categoryId = null) => {
  try {
    logger.info('Invalidating product cache', { categoryId });
    
    // Invalidate new arrivals cache
    await deleteCachePattern(`products:new-arrivals:*:${CACHE_VERSION}`);
    
    // If category specified, invalidate category-specific product cache
    if (categoryId) {
      await deleteCachePattern(`products:category:${categoryId}:*:${CACHE_VERSION}`);
    } else {
      // Invalidate all product category caches
      await deleteCachePattern(`products:category:*:${CACHE_VERSION}`);
    }
    
    // Invalidate search caches if they exist
    await deleteCachePattern(`products:search:*:${CACHE_VERSION}`);
    
    return true;
  } catch (error) {
    logger.error('Error invalidating product cache', { error: error.message });
    return false;
  }
};

/**
 * Invalidate reel caches
 */
const invalidateReelCache = async () => {
  try {
    logger.info('Invalidating reel cache');
    // Delete all reel-related cache keys
    await deleteCachePattern(`reels:*:${CACHE_VERSION}`);
    return true;
  } catch (error) {
    logger.error('Error invalidating reel cache', { error: error.message });
    return false;
  }
};

/**
 * Invalidate all caches for a specific resource type
 * @param {string} resourceType - Type of resource ('banners', 'categories', 'products', 'reels')
 * @param {Object} options - Additional options for invalidation
 */
const invalidateCache = async (resourceType, options = {}) => {
  switch (resourceType) {
    case 'banners':
      return await invalidateBannerCache();
    case 'categories':
      return await invalidateCategoryCache(options.categoryId);
    case 'products':
      return await invalidateProductCache(options.categoryId);
    case 'reels':
      return await invalidateReelCache();
    default:
      logger.warn('Unknown resource type for cache invalidation', { resourceType });
      return false;
  }
};

/**
 * Middleware to automatically invalidate cache after successful operations
 * @param {string} resourceType - Type of resource to invalidate
 * @param {Function} getOptions - Function to extract options from req/res
 */
const invalidateCacheMiddleware = (resourceType, getOptions = () => ({})) => {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json function to invalidate cache after response
    res.json = function (data) {
      // Only invalidate on successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache asynchronously (don't wait for it)
        const options = getOptions(req, res, data);
        invalidateCache(resourceType, options).catch((err) => {
          logger.error('Failed to invalidate cache in middleware', {
            resourceType,
            error: err.message,
          });
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  invalidateBannerCache,
  invalidateCategoryCache,
  invalidateProductCache,
  invalidateReelCache,
  invalidateCache,
  invalidateCacheMiddleware,
};
