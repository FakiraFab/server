const { getCache, setCache, isRedisAvailable } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache version for handling schema changes
 * Increment this when you need to invalidate all existing cache
 */
const CACHE_VERSION = 'v1';

/**
 * Generate cache key from request
 * @param {string} prefix - Cache key prefix (e.g., 'banners', 'categories')
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options for key generation
 * @returns {string} - Generated cache key
 */
const generateCacheKey = (prefix, req, options = {}) => {
  const parts = [prefix];

  // Add custom suffix if provided
  if (options.suffix) {
    parts.push(options.suffix);
  }

  // Add query parameters to key
  const queryParams = [];
  if (req.query) {
    // Sort query params for consistent keys
    const sortedKeys = Object.keys(req.query).sort();
    sortedKeys.forEach((key) => {
      if (options.includeParams && options.includeParams.includes(key)) {
        queryParams.push(`${key}:${req.query[key]}`);
      }
    });
  }

  if (queryParams.length > 0) {
    parts.push(...queryParams);
  }

  // Add version
  parts.push(CACHE_VERSION);

  return parts.join(':');
};

/**
 * Cache middleware factory
 * @param {Object} options - Caching options
 * @param {string} options.prefix - Cache key prefix
 * @param {number} options.ttl - Time to live in seconds
 * @param {string} options.suffix - Additional suffix for cache key
 * @param {Array<string>} options.includeParams - Query parameters to include in cache key
 * @returns {Function} Express middleware
 */
const cache = (options = {}) => {
  const {
    prefix = 'cache',
    ttl = 3600, // Default 1 hour
    suffix = '',
    includeParams = [],
  } = options;

  return async (req, res, next) => {
    // Skip caching if Redis is not available
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, skipping cache', { prefix });
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = generateCacheKey(prefix, req, { suffix, includeParams });

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        // Cache hit - return cached data
        return res.json(cachedData);
      }

      // Cache miss - intercept res.json to cache the response
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache asynchronously (don't wait for it)
          setCache(cacheKey, data, ttl).catch((err) => {
            logger.error('Failed to cache response', {
              key: cacheKey,
              error: err.message,
            });
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', {
        prefix,
        error: error.message,
      });
      // On error, continue without caching
      next();
    }
  };
};

/**
 * Cache warming function - pre-populate cache with critical data
 * @param {string} url - The URL to warm
 * @param {string} cacheKey - The cache key to use
 * @param {Function} dataFetcher - Async function that returns data to cache
 * @param {number} ttl - Time to live in seconds
 */
const warmCache = async (cacheKey, dataFetcher, ttl) => {
  try {
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, skipping cache warming', { cacheKey });
      return;
    }

    logger.info('Warming cache', { cacheKey });
    const data = await dataFetcher();
    await setCache(cacheKey, data, ttl);
    logger.info('Cache warmed successfully', { cacheKey });
  } catch (error) {
    logger.error('Error warming cache', {
      cacheKey,
      error: error.message,
    });
  }
};

module.exports = {
  cache,
  generateCacheKey,
  warmCache,
  CACHE_VERSION,
};
