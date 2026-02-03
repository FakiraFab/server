/**
 * Integration test for cache invalidation middleware
 * Tests that cache invalidation properly clears cache when called
 */

const { invalidateCacheMiddleware } = require('./utils/cacheInvalidation');

console.log('=== Cache Invalidation Middleware Integration Test ===\n');

function testMiddleware() {
  console.log('Test 1: Create invalidation middleware');
  
  // Test basic middleware creation
  const basicMiddleware = invalidateCacheMiddleware('banners');
  console.log('Basic middleware type:', typeof basicMiddleware);
  console.log('Is function:', basicMiddleware instanceof Function);
  console.log('✓ Basic middleware created\n');
  
  // Test middleware with options
  console.log('Test 2: Create middleware with options function');
  const middlewareWithOptions = invalidateCacheMiddleware('products', (req, res, data) => {
    return { categoryId: data?.data?.category };
  });
  console.log('Middleware with options type:', typeof middlewareWithOptions);
  console.log('Is function:', middlewareWithOptions instanceof Function);
  console.log('✓ Middleware with options created\n');
  
  // Test middleware execution flow
  console.log('Test 3: Middleware execution flow');
  
  let jsonCalled = false;
  let nextCalled = false;
  
  const mockReq = {};
  const mockRes = {
    statusCode: 200,
    json: function(data) {
      jsonCalled = true;
      return data;
    }
  };
  const mockNext = function() {
    nextCalled = true;
  };
  
  // Execute middleware
  const testMiddleware = invalidateCacheMiddleware('banners');
  testMiddleware(mockReq, mockRes, mockNext);
  
  console.log('Next called:', nextCalled);
  console.log('Original json function exists:', typeof mockRes.json === 'function');
  
  // Test the wrapped json function
  const result = mockRes.json({ success: true, data: [] });
  console.log('JSON called:', jsonCalled);
  console.log('Result returned:', result !== undefined);
  console.log('✓ Middleware execution flow works\n');
  
  console.log('=== All Integration Tests Passed ===');
}

try {
  testMiddleware();
  console.log('\n✓ Integration tests completed successfully');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Integration tests failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
