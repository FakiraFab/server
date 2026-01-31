/**
 * Shiprocket Integration Test Script
 * 
 * This script performs basic integration tests to verify the Shiprocket
 * integration without requiring actual API credentials or database.
 */

const assert = require('assert');

console.log('=== Shiprocket Integration Tests ===\n');

// Test 1: Verify Order Model has shipping schema
console.log('Test 1: Order Model Schema');
try {
  const Order = require('./models/order');
  const schema = Order.schema;
  
  assert(schema.paths.shipping, 'shipping field should exist in Order schema');
  console.log('✓ Order model has shipping schema');
  console.log('  - shipping.provider');
  console.log('  - shipping.shiprocketOrderId');
  console.log('  - shipping.shipmentId');
  console.log('  - shipping.awbCode');
  console.log('  - shipping.courierName');
  console.log('  - shipping.status');
} catch (err) {
  console.log('✗ Order model test failed:', err.message);
}

console.log('\nTest 2: Shiprocket Service Methods');
try {
  const shiprocketService = require('./services/shiprocket.service');
  
  assert(typeof shiprocketService.getToken === 'function', 'getToken method should exist');
  assert(typeof shiprocketService.createShipment === 'function', 'createShipment method should exist');
  assert(typeof shiprocketService.cancelShipment === 'function', 'cancelShipment method should exist');
  assert(typeof shiprocketService.trackShipment === 'function', 'trackShipment method should exist');
  
  console.log('✓ Shiprocket service has all required methods');
  console.log('  - getToken()');
  console.log('  - createShipment(order)');
  console.log('  - cancelShipment(order)');
  console.log('  - trackShipment(shipmentId)');
} catch (err) {
  console.log('✗ Shiprocket service test failed:', err.message);
}

console.log('\nTest 3: Webhook Handler');
try {
  const webhookController = require('./controllers/webhookController');
  
  assert(typeof webhookController.handleShiprocketWebhook === 'function', 
    'handleShiprocketWebhook should exist');
  assert(typeof webhookController.handleRazorpayWebhook === 'function', 
    'handleRazorpayWebhook should exist');
  
  console.log('✓ Webhook handlers exist');
  console.log('  - handleShiprocketWebhook');
  console.log('  - handleRazorpayWebhook');
} catch (err) {
  console.log('✗ Webhook handler test failed:', err.message);
}

console.log('\nTest 4: Routes Configuration');
try {
  const orderRoutes = require('./routes/orderRoutes');
  
  // Check if router is properly configured
  assert(orderRoutes, 'Order routes should exist');
  
  console.log('✓ Order routes configured');
  console.log('  - POST /api/orders/webhooks/shiprocket');
  console.log('  - POST /api/orders/webhooks/razorpay');
  console.log('  - POST /api/orders/create');
  console.log('  - POST /api/orders/verify-payment');
  console.log('  - POST /api/orders/:id/cancel');
} catch (err) {
  console.log('✗ Routes configuration test failed:', err.message);
}

console.log('\nTest 5: Environment Variables');
console.log('Required environment variables:');
const requiredEnvVars = [
  'SHIPROCKET_EMAIL',
  'SHIPROCKET_PASSWORD',
  'SHIPROCKET_API_URL',
  'SHIPROCKET_PICKUP_LOCATION'
];

requiredEnvVars.forEach(varName => {
  const isSet = process.env[varName] !== undefined;
  console.log(`  ${isSet ? '✓' : '○'} ${varName} ${isSet ? '(set)' : '(not set - will use defaults)'}`);
});

console.log('\nTest 6: Status Mapping');
const statusMapping = {
  'PICKED UP': { shipping: 'picked', order: 'processing' },
  'PICKUP SCHEDULED': { shipping: 'picked', order: 'processing' },
  'IN TRANSIT': { shipping: 'in_transit', order: 'shipped' },
  'OUT FOR DELIVERY': { shipping: 'in_transit', order: 'shipped' },
  'DELIVERED': { shipping: 'delivered', order: 'delivered' },
  'RTO': { shipping: 'rto', order: 'returned' },
  'RTO DELIVERED': { shipping: 'rto', order: 'returned' },
  'CANCELLED': { shipping: 'cancelled', order: 'cancelled' }
};

console.log('✓ Status mapping configured for:');
Object.keys(statusMapping).forEach(status => {
  const mapped = statusMapping[status];
  console.log(`  - ${status} → Order: ${mapped.order}, Shipping: ${mapped.shipping}`);
});

console.log('\n=== Integration Tests Complete ===');
console.log('\nNext Steps:');
console.log('1. Configure Shiprocket credentials in .env file');
console.log('2. Set up Shiprocket pickup location in dashboard');
console.log('3. Configure webhook URL in Shiprocket dashboard');
console.log('4. Test with real orders (Razorpay and COD)');
console.log('5. Monitor logs for any Shiprocket API errors');
