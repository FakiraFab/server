// Test file for Reels API
// This file demonstrates how to use the reels API endpoints

const BASE_URL = 'http://localhost:5000/api/reels';

// Sample data for testing
const sampleReels = [
  {
    title: 'Bird Block Printed best Cotton Fabric',
    price: '₹276',
    videoUrl: 'https://cdn.shopify.com/videos/c/vp/2345a3fec28b4ece9bcbe807c62fdb25/2345a3fec28b4ece9bcbe807c62fdb25.HD-1080p-7.2Mbps-49954218.mp4',
    isVideo: true,
    isActive: true,
    description: 'High quality cotton fabric with bird block print design',
    tags: ['cotton', 'block-print', 'fabric'],
    order: 1
  },
  {
    title: 'Traditional Block Printed Fabric',
    price: '₹320',
    videoUrl: 'https://cdn.shopify.com/videos/c/vp/e5282c31259042978ff302ba75a321f3/e5282c31259042978ff302ba75a321f3.HD-1080p-4.8Mbps-49954706.mp4',
    isVideo: true,
    isActive: true,
    description: 'Traditional handcrafted block printed fabric',
    tags: ['traditional', 'handcrafted', 'block-print'],
    order: 2
  },
  {
    title: 'Premium Cotton Fabric Collection',
    price: '₹450',
    videoUrl: 'https://cdn.shopify.com/videos/c/vp/094b53fa4923489ebd388d9eeb9b7061/094b53fa4923489ebd388d9eeb9b7061.HD-1080p-7.2Mbps-49954705.mp4',
    isVideo: true,
    isActive: true,
    description: 'Premium quality cotton fabric with modern designs',
    tags: ['premium', 'cotton', 'modern'],
    order: 3
  }
];

// API Endpoints Documentation:
/*
GET /api/reels - Get all reels with pagination
GET /api/reels/active - Get only active reels
GET /api/reels/:id - Get a specific reel
POST /api/reels - Create a new reel
PATCH /api/reels/:id - Update a reel
PATCH /api/reels/:id/toggle-visibility - Toggle reel visibility
DELETE /api/reels/:id - Delete a reel

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)
- isActive: Filter by active status (true/false)

Example Usage:
1. Create a reel:
   POST /api/reels
   Body: {
     "title": "Bird Block Printed best Cotton Fabric",
     "price": "₹276",
     "videoUrl": "https://example.com/video.mp4",
     "isVideo": true,
     "isActive": true,
     "description": "High quality cotton fabric",
     "tags": ["cotton", "block-print"],
     "order": 1
   }

2. Get all reels:
   GET /api/reels?page=1&limit=10

3. Get active reels only:
   GET /api/reels/active

4. Update a reel:
   PATCH /api/reels/:id
   Body: {
     "title": "Updated Title",
     "price": "₹300"
   }

5. Toggle visibility:
   PATCH /api/reels/:id/toggle-visibility

6. Delete a reel:
   DELETE /api/reels/:id
*/

console.log('Reels API Documentation:');
console.log('Base URL:', BASE_URL);
console.log('Available endpoints:');
console.log('- GET /api/reels - Get all reels with pagination');
console.log('- GET /api/reels/active - Get only active reels');
console.log('- GET /api/reels/:id - Get a specific reel');
console.log('- POST /api/reels - Create a new reel');
console.log('- PATCH /api/reels/:id - Update a reel');
console.log('- PATCH /api/reels/:id/toggle-visibility - Toggle reel visibility');
console.log('- DELETE /api/reels/:id - Delete a reel');
console.log('\nSample data structure:', JSON.stringify(sampleReels[0], null, 2)); 