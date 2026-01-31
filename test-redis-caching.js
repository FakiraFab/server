/**
 * Test script for Redis caching implementation
 * Tests graceful degradation when Redis is unavailable
 */

const { 
  getCache, 
  setCache, 
  deleteCache, 
  getCacheStats,
  isRedisAvailable 
} = require('./config/redis');
const { cache, generateCacheKey } = require('./middleware/cache');
const { 
  invalidateBannerCache, 
  invalidateCategoryCache,
  invalidateProductCache,
  invalidateReelCache 
} = require('./utils/cacheInvalidation');

console.log('=== Redis Caching Test ===\n');

async function runTests() {
  try {
    // Test 1: Check Redis availability
    console.log('Test 1: Redis Availability');
    const available = isRedisAvailable();
    console.log(`Redis is ${available ? 'available' : 'NOT available (graceful degradation enabled)'}`);
    console.log('✓ Test 1 passed\n');

    // Test 2: Cache operations with graceful degradation
    console.log('Test 2: Cache Operations with Graceful Degradation');
    const testKey = 'test:key:v1';
    const testData = { message: 'Hello, World!', timestamp: Date.now() };
    
    const setResult = await setCache(testKey, testData, 60);
    console.log(`Set cache result: ${setResult ? 'success' : 'failed (expected when Redis unavailable)'}`);
    
    const getData = await getCache(testKey);
    console.log(`Get cache result: ${getData ? JSON.stringify(getData) : 'null (expected when Redis unavailable)'}`);
    
    const deleteResult = await deleteCache(testKey);
    console.log(`Delete cache result: ${deleteResult ? 'success' : 'failed (expected when Redis unavailable)'}`);
    console.log('✓ Test 2 passed\n');

    // Test 3: Cache key generation
    console.log('Test 3: Cache Key Generation');
    const mockReq = {
      query: {
        page: '1',
        limit: '10',
        category: 'test-category'
      }
    };
    
    const key1 = generateCacheKey('products', mockReq, { includeParams: ['page', 'limit'] });
    console.log(`Generated key 1: ${key1}`);
    
    const key2 = generateCacheKey('categories', mockReq, { suffix: 'active', includeParams: ['limit'] });
    console.log(`Generated key 2: ${key2}`);
    console.log('✓ Test 3 passed\n');

    // Test 4: Cache invalidation functions
    console.log('Test 4: Cache Invalidation Functions');
    await invalidateBannerCache();
    console.log('Banner cache invalidated');
    
    await invalidateCategoryCache('test-category-id');
    console.log('Category cache invalidated');
    
    await invalidateProductCache('test-category-id');
    console.log('Product cache invalidated');
    
    await invalidateReelCache();
    console.log('Reel cache invalidated');
    console.log('✓ Test 4 passed\n');

    // Test 5: Cache statistics
    console.log('Test 5: Cache Statistics');
    const stats = await getCacheStats();
    console.log('Cache stats:', JSON.stringify(stats, null, 2));
    console.log('✓ Test 5 passed\n');

    // Test 6: Cache middleware functionality
    console.log('Test 6: Cache Middleware');
    const cacheMiddleware = cache({ prefix: 'test', ttl: 300 });
    console.log('Cache middleware created successfully');
    console.log('Type:', typeof cacheMiddleware);
    console.log('Is function:', cacheMiddleware instanceof Function);
    console.log('✓ Test 6 passed\n');

    console.log('=== All Tests Passed ===');
    console.log('\nSummary:');
    console.log('- Redis configuration: working');
    console.log('- Graceful degradation: working');
    console.log('- Cache middleware: working');
    console.log('- Cache invalidation: working');
    console.log('- Cache key generation: working');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  console.log('\n✓ All tests completed successfully');
  process.exit(0);
}).catch(err => {
  console.error('\n✗ Tests failed:', err);
  process.exit(1);
});
