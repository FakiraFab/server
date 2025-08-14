# Product Search API Documentation

This document describes the optimized search functionality added to the Product API, designed to work seamlessly with the frontend search modal.

## Overview

The search API provides fast, flexible product search with the following features:
- **Text-based search** using MongoDB text indexes for optimal performance
- **Fallback regex search** for compatibility
- **Advanced filtering** by category, subcategory, price, material, and style
- **Search suggestions** for autocomplete functionality
- **Pagination** and sorting options
- **Search analytics** and suggestions

## API Endpoints

### 1. Search Products
`GET /api/products/search`

Search for products using various criteria and filters.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `q` | string | Search query text | `''` |
| `page` | number | Page number for pagination | `1` |
| `limit` | number | Number of results per page | `20` |
| `category` | string | Category ID or name to filter by | - |
| `subcategory` | string | Subcategory ID or name to filter by | - |
| `sort` | string | Sort order (`-createdAt`, `createdAt`, `name`, `-name`, `price`, `-price`) | `-createdAt` |
| `minPrice` | number | Minimum price filter | - |
| `maxPrice` | number | Maximum price filter | - |
| `material` | string | Material filter | - |
| `style` | string | Style filter | - |

#### Example Requests

```bash
# Basic search
GET /api/products/search?q=saree&limit=10

# Search with filters
GET /api/products/search?q=silk&category=64a1b2c3d4e5f6789012345&minPrice=1000&maxPrice=5000

# Search by material
GET /api/products/search?q=cotton&material=cotton&sort=price

# Empty search (returns featured products)
GET /api/products/search?limit=8
```

#### Response Format

```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Traditional Silk Saree",
      "description": "Beautiful handcrafted silk saree",
      "price": 2500,
      "category": { "name": "Sarees" },
      "subcategory": { "name": "Silk Sarees" },
      "specifications": {
        "material": "Silk",
        "style": "Traditional",
        "length": "6 meters",
        "blousePiece": "Yes"
      },
      "options": [
        {
          "color": "Red",
          "colorCode": "#e53e3e",
          "quantity": 5,
          "price": 2500,
          "imageUrls": ["url1", "url2"]
        }
      ]
    }
  ],
  "total": 25,
  "query": "saree",
  "suggestions": {
    "materials": ["Silk", "Cotton", "Georgette"],
    "styles": ["Traditional", "Modern", "Designer"],
    "colors": ["Red", "Blue", "Green"]
  },
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "hasMore": true
  }
}
```

### 2. Search Suggestions
`GET /api/products/search/suggestions`

Get autocomplete suggestions for search queries.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `q` | string | Search query (minimum 2 characters) | - |
| `limit` | number | Maximum number of suggestions | `10` |

#### Example Request

```bash
GET /api/products/search/suggestions?q=cotton&limit=5
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "type": "product", "value": "Cotton Saree" },
      { "type": "material", "value": "Cotton" },
      { "type": "style", "value": "Traditional" },
      { "type": "color", "value": "Blue" }
    ],
    "popular": [
      "Cotton Fabrics",
      "Cotton Sarees"
    ]
  }
}
```

## Search Features

### Text Search Optimization

The API uses a two-tier search approach:

1. **MongoDB Text Index** (Primary)
   - Automatically created on product fields
   - Provides fast, relevance-based search
   - Supports text scoring and ranking

2. **Regex Fallback** (Secondary)
   - Used when text index is unavailable
   - Searches across multiple fields
   - Case-insensitive matching

### Searchable Fields

- **Product Name** (highest priority)
- **Description**
- **Material** (specifications)
- **Style** (specifications)
- **Design Number** (specifications)
- **Color Options**

### Filtering Options

- **Category/Subcategory**: Filter by product categories
- **Price Range**: Filter by minimum and maximum price
- **Material**: Filter by specific materials
- **Style**: Filter by design styles
- **Sorting**: Multiple sort options including relevance

### Performance Features

- **Database Indexes**: Optimized for search queries
- **Lean Queries**: Reduced memory usage
- **Pagination**: Efficient result handling
- **Caching Ready**: Designed for Redis/Memcached integration

## Database Indexes

The following indexes are automatically created for optimal search performance:

```javascript
// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  'specifications.material': 'text',
  'specifications.style': 'text',
  'specifications.designNo': 'text',
  'options.color': 'text'
}, {
  weights: {
    name: 10,           // Highest priority
    description: 5,      // Medium priority
    'specifications.material': 3,
    'specifications.style': 3,
    'specifications.designNo': 2,
    'options.color': 2
  },
  name: 'product_search_index'
});

// Compound index for filtering
productSchema.index({ category: 1, subcategory: 1, name: 1 });
```

## Frontend Integration

The search API is designed to work seamlessly with the provided React search modal:

```typescript
// Search products
const searchProducts = async (query: string): Promise<ApiResponse<Product[]>> => {
  if (!query.trim()) {
    // Fetch default products when no search query
    const res = await apiClient.get('/products', {
      params: {
        sort: '-createdAt',
        limit: 8
      }
    });
    return res.data;
  }

  // Search with query
  const res = await apiClient.get('/products/search', {
    params: {
      q: query,
      limit: 20
    }
  });
  return res.data;
};
```

## Error Handling

The API provides comprehensive error handling:

- **Validation Errors**: Detailed field-level validation messages
- **Database Errors**: Graceful fallbacks for search operations
- **Rate Limiting**: Ready for implementation
- **Logging**: Search query logging for analytics

## Testing

Use the provided test script to verify search functionality:

```bash
node test-search-api.js
```

## Future Enhancements

- **Search Analytics**: Track popular searches and user behavior
- **Personalized Results**: User preference-based search ranking
- **Fuzzy Search**: Handle typos and similar terms
- **Search History**: User search history and suggestions
- **Advanced Filters**: More granular filtering options
- **Search Caching**: Redis-based result caching

## Performance Considerations

- **Index Optimization**: Regular index maintenance and monitoring
- **Query Optimization**: Use explain() to analyze query performance
- **Result Limiting**: Implement reasonable limits for search queries
- **Database Connection Pooling**: Optimize connection management
- **Search Result Caching**: Cache frequent search results

## Security

- **Input Validation**: All search parameters are validated
- **SQL Injection Protection**: MongoDB driver provides protection
- **Rate Limiting**: Ready for implementation
- **Access Control**: Can be integrated with authentication middleware

