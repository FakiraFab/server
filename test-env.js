// Simple environment variable test
require('dotenv').config();

console.log('=== Environment Variables Test ===');
console.log('AuthKey:', process.env.AuthKey ? 'SET' : 'NOT SET');
console.log('MSG91_AUTH_KEY:', process.env.MSG91_AUTH_KEY ? 'SET' : 'NOT SET');
console.log('All env vars with "auth" in name:', Object.keys(process.env).filter(key => key.toLowerCase().includes('auth')));
console.log('All env vars with "msg" in name:', Object.keys(process.env).filter(key => key.toLowerCase().includes('msg')));
console.log('================================'); 