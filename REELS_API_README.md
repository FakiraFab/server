# Reels Management API

This API provides complete CRUD operations for managing Instagram-style reels with video content.

## Features

- ✅ Complete CRUD operations
- ✅ Pagination support
- ✅ Visibility toggle (on/off)
- ✅ Order management
- ✅ Tagging system
- ✅ Input validation
- ✅ Error handling
- ✅ Active reels filtering

## Database Schema

```javascript
{
  title: String (required),
  price: String (required),
  videoUrl: String (required, must be valid URL),
  isVideo: Boolean (default: true),
  isActive: Boolean (default: true),
  description: String (optional),
  tags: [String] (optional),
  order: Number (default: 0),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

## API Endpoints

### Base URL
```
http://localhost:5000/api/reels
```

### 1. Get All Reels
```http
GET /api/reels
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `isActive` (optional): Filter by active status (true/false)

**Example:**
```http
GET /api/reels?page=1&limit=5&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 10
  }
}
```

### 2. Get Active Reels Only
```http
GET /api/reels/active
```

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

### 3. Get Single Reel
```http
GET /api/reels/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Bird Block Printed best Cotton Fabric",
    "price": "₹276",
    "videoUrl": "https://example.com/video.mp4",
    "isVideo": true,
    "isActive": true,
    "description": "High quality cotton fabric",
    "tags": ["cotton", "block-print"],
    "order": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Create Reel
```http
POST /api/reels
```

**Request Body:**
```json
{
  "title": "Bird Block Printed best Cotton Fabric",
  "price": "₹276",
  "videoUrl": "https://cdn.shopify.com/videos/c/vp/2345a3fec28b4ece9bcbe807c62fdb25/2345a3fec28b4ece9bcbe807c62fdb25.HD-1080p-7.2Mbps-49954218.mp4",
  "isVideo": true,
  "isActive": true,
  "description": "High quality cotton fabric with bird block print design",
  "tags": ["cotton", "block-print", "fabric"],
  "order": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reel created successfully",
    "data": {...}
  }
}
```

### 5. Update Reel
```http
PATCH /api/reels/:id
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": "₹300",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reel updated successfully",
    "data": {...}
  }
}
```

### 6. Toggle Reel Visibility
```http
PATCH /api/reels/:id/toggle-visibility
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reel activated successfully",
    "data": {...}
  }
}
```

### 7. Delete Reel
```http
DELETE /api/reels/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reel deleted successfully"
  }
}
```

## Validation Rules

### Create Reel
- `title`: Required, non-empty string
- `price`: Required, non-empty string
- `videoUrl`: Required, must be valid URL
- `isVideo`: Optional boolean (default: true)
- `isActive`: Optional boolean (default: true)
- `description`: Optional string
- `tags`: Optional array of strings
- `order`: Optional number, minimum 0 (default: 0)

### Update Reel
- All fields are optional
- Same validation rules as create, but not required

## Error Responses

### 404 - Reel Not Found
```json
{
  "success": false,
  "error": "Reel not found"
}
```

### 400 - Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "title": "Title is required"
  }
}
```

## Sample Data

```javascript
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
  }
];
```

## Usage Examples

### Using cURL

1. **Create a new reel:**
```bash
curl -X POST http://localhost:5000/api/reels \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bird Block Printed best Cotton Fabric",
    "price": "₹276",
    "videoUrl": "https://example.com/video.mp4",
    "isVideo": true,
    "isActive": true,
    "description": "High quality cotton fabric",
    "tags": ["cotton", "block-print"],
    "order": 1
  }'
```

2. **Get all reels:**
```bash
curl http://localhost:5000/api/reels
```

3. **Get active reels only:**
```bash
curl http://localhost:5000/api/reels/active
```

4. **Update a reel:**
```bash
curl -X PATCH http://localhost:5000/api/reels/REEL_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "price": "₹300"
  }'
```

5. **Toggle visibility:**
```bash
curl -X PATCH http://localhost:5000/api/reels/REEL_ID/toggle-visibility
```

6. **Delete a reel:**
```bash
curl -X DELETE http://localhost:5000/api/reels/REEL_ID
```

### Using JavaScript/Fetch

```javascript
// Create a reel
const createReel = async (reelData) => {
  const response = await fetch('http://localhost:5000/api/reels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reelData),
  });
  return response.json();
};

// Get all reels
const getReels = async (page = 1, limit = 10) => {
  const response = await fetch(`http://localhost:5000/api/reels?page=${page}&limit=${limit}`);
  return response.json();
};

// Get active reels
const getActiveReels = async () => {
  const response = await fetch('http://localhost:5000/api/reels/active');
  return response.json();
};
```

## Notes

- The API follows RESTful conventions
- All responses use the same format as other APIs in the project
- Error handling is consistent with the existing codebase
- The `order` field can be used to control the display order of reels
- The `isActive` field controls visibility (true = visible, false = hidden)
- Video URLs should be valid URLs pointing to video files
- Tags are stored as an array of strings for easy filtering and categorization 