// Test WhatsApp configuration
require('dotenv').config();

const msg91Config = require('./config/msg91');
const WhatsAppService = require('./utils/whatsApp');

console.log('=== Testing WhatsApp Configuration ===');

// Test the configuration
const whatsAppService = new WhatsAppService();

// Test phone number formatting
const testPhone = "9876543210";
const formattedPhone = whatsAppService.formatPhoneNumber(testPhone);
console.log('Phone formatting test:', testPhone, '->', formattedPhone);

// Test message components
const testInquiry = {
  userName: "Test User",
  whatsappNumber: testPhone,
  variant: "Red"
};

const testProduct = {
  name: "Test Product",
  price: 999,
  options: [
    { color: "Red", price: 999 }
  ]
};

const components = whatsAppService.prepareMessageComponents(testInquiry, testProduct);
console.log('Message components:', JSON.stringify(components, null, 2));

console.log('=== Configuration Test Complete ==='); 