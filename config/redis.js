const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisConnected = false;

// Redis configuration with retry logic
const createRedisClient = () => {
  if (!process.env.CACHE_ENABLED || process.env.CACHE_ENABLED === 'false') {
    logger.info('Redis caching is disabled via CACHE_ENABLED environment variable');
    return null;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  const client = new Redis(redisConfig);

  client.on('connect', () => {
    logger.info('Redis client connecting...', {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
    });
  });

  client.on('ready', () => {
    isRedisConnected = true;
    logger.info('Redis client connected and ready');
  });

  client.on('error', (err) => {
    isRedisConnected = false;
    logger.error('Redis client error', {
      message: err.message,
      stack: err.stack,
    });
  });

  client.on('close', () => {
    isRedisConnected = false;
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
  });

  return client;
};

// Initialize Redis client
const initRedis = () => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

// Get Redis client
const getRedisClient = () => {
  if (!redisClient) {
    redisClient = initRedis();
  }
  return redisClient;
};

// Check if Redis is connected
const isRedisAvailable = () => {
  return isRedisConnected && redisClient !== null;
};

// Get cache with error handling
const getCache = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return null;
    }
    const data = await redisClient.get(key);
    if (data) {
      logger.info('Cache hit', { key });
      return JSON.parse(data);
    }
    logger.info('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Error getting cache', {
      key,
      message: error.message,
    });
    return null;
  }
};

// Set cache with error handling and compression
const setCache = async (key, value, ttl = 3600) => {
  try {
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, skipping cache set', { key });
      return false;
    }
    
    const serialized = JSON.stringify(value);
    
    // Log if the cached object is large (>100KB)
    const sizeInKB = Buffer.byteLength(serialized, 'utf8') / 1024;
    if (sizeInKB > 100) {
      logger.info('Large object being cached', {
        key,
        sizeKB: sizeInKB.toFixed(2),
      });
    }
    
    await redisClient.setex(key, ttl, serialized);
    logger.info('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Error setting cache', {
      key,
      message: error.message,
    });
    return false;
  }
};

// Delete cache key
const deleteCache = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }
    await redisClient.del(key);
    logger.info('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.error('Error deleting cache', {
      key,
      message: error.message,
    });
    return false;
  }
};

// Delete cache keys by pattern
const deleteCachePattern = async (pattern) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info('Cache pattern deleted', { pattern, count: keys.length });
    }
    return true;
  } catch (error) {
    logger.error('Error deleting cache pattern', {
      pattern,
      message: error.message,
    });
    return false;
  }
};

// Clear all cache
const clearAllCache = async () => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }
    await redisClient.flushdb();
    logger.info('All cache cleared');
    return true;
  } catch (error) {
    logger.error('Error clearing all cache', {
      message: error.message,
    });
    return false;
  }
};

// Get cache statistics
const getCacheStats = async () => {
  try {
    if (!isRedisAvailable()) {
      return {
        connected: false,
        error: 'Redis not available',
      };
    }

    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbsize();
    const memory = await redisClient.info('memory');

    // Parse info strings
    const parseInfo = (infoStr) => {
      const lines = infoStr.split('\r\n');
      const result = {};
      lines.forEach((line) => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key.trim()] = value.trim();
          }
        }
      });
      return result;
    };

    const statsData = parseInfo(info);
    const memoryData = parseInfo(memory);

    return {
      connected: true,
      dbSize,
      hits: statsData.keyspace_hits || 0,
      misses: statsData.keyspace_misses || 0,
      hitRate: statsData.keyspace_hits && statsData.keyspace_misses
        ? ((parseInt(statsData.keyspace_hits) / (parseInt(statsData.keyspace_hits) + parseInt(statsData.keyspace_misses))) * 100).toFixed(2) + '%'
        : 'N/A',
      memoryUsed: memoryData.used_memory_human || 'N/A',
      totalConnections: statsData.total_connections_received || 0,
    };
  } catch (error) {
    logger.error('Error getting cache stats', {
      message: error.message,
    });
    return {
      connected: false,
      error: error.message,
    };
  }
};

// Graceful shutdown
const closeRedis = async () => {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    await redisClient.quit();
    redisClient = null;
    isRedisConnected = false;
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  clearAllCache,
  getCacheStats,
  closeRedis,
};
