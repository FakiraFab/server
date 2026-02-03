const { warmCache } = require('../middleware/cache');
const { isRedisAvailable } = require('../config/redis');
const logger = require('./logger');
const Banner = require('../models/banner');
const Category = require('../models/category');
const Product = require('../models/product');
const Reel = require('../models/reel');

/**
 * Warm critical caches on server startup
 */
const warmCriticalCaches = async () => {
  if (!isRedisAvailable()) {
    logger.info('Redis not available, skipping cache warming');
    return;
  }

  logger.info('Starting cache warming...');

  try {
    // Warm banner cache
    await warmCache(
      'banners:page:1:limit:10:v1',
      async () => {
        const [banners, total] = await Promise.all([
          Banner.find().sort({ createdAt: -1 }).limit(10),
          Banner.countDocuments(),
        ]);
        return {
          success: true,
          data: banners,
          currentPage: 1,
          totalPages: Math.ceil(total / 10),
          totalItems: total,
        };
      },
      3600
    );

    // Warm categories cache (limit 20)
    await warmCache(
      'categories:limit:20:page:1:sort:name:v1',
      async () => {
        const [categories, total] = await Promise.all([
          Category.find().limit(20).sort('name').lean(),
          Category.countDocuments(),
        ]);
        return {
          success: true,
          data: categories,
          page: 1,
          limit: 20,
          total,
          totalPages: Math.ceil(total / 20),
          message: 'Categories retrieved successfully',
        };
      },
      21600
    );

    // Warm active reels cache
    await warmCache(
      'reels:active:v1',
      async () => {
        const reels = await Reel.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        return {
          success: true,
          data: reels,
        };
      },
      3600
    );

    // Warm new arrivals cache (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const dateString = fourteenDaysAgo.toISOString();
    
    await warmCache(
      `products:createdAt[gte]:${dateString}:limit:4:page:1:sort:-createdAt:v1`,
      async () => {
        const filter = {
          createdAt: { $gte: fourteenDaysAgo },
        };
        
        const [products, total] = await Promise.all([
          Product.find(filter)
            .populate('category', 'name description categoryImage categoryBannerImage')
            .populate('subcategory', 'name')
            .limit(4)
            .sort('-createdAt')
            .lean(),
          Product.countDocuments(filter),
        ]);

        return {
          success: true,
          data: products,
          page: 1,
          limit: 4,
          total,
          totalPages: Math.ceil(total / 4),
        };
      },
      900 // 15 minutes
    );

    logger.info('Cache warming completed successfully');
  } catch (error) {
    logger.error('Error during cache warming', {
      error: error.message,
      stack: error.stack,
    });
  }
};

module.exports = {
  warmCriticalCaches,
};
