# Redis Caching Implementation Documentation

## Overview

This document describes the Redis caching implementation for the FakiraFab e-commerce backend API. The caching layer optimizes API response times and reduces database load by implementing a cache-aside pattern with automatic invalidation.

## Table of Contents

1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [Cache Keys Structure](#cache-keys-structure)
4. [TTL Settings](#ttl-settings)
5. [API Endpoints](#api-endpoints)
6. [Cache Invalidation](#cache-invalidation)
7. [Monitoring and Management](#monitoring-and-management)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Architecture

### Components

1. **Redis Client** (`config/redis.js`)
   - Connection management with retry logic
   - Graceful degradation when Redis is unavailable
   - Connection pooling and error handling

2. **Cache Middleware** (`middleware/cache.js`)
   - Intercepts GET requests
   - Checks cache before hitting the database
   - Automatically caches successful responses
   - Generates consistent cache keys

3. **Cache Invalidation** (`utils/cacheInvalidation.js`)
   - Clears related caches on data mutations
   - Pattern-based cache clearing
   - Resource-specific invalidation strategies

4. **Cache Warming** (`utils/cacheWarming.js`)
   - Pre-populates critical data on server startup
   - Reduces cold-start latency
   - Runs asynchronously to avoid blocking startup

### Cache Strategy

**Cache-Aside Pattern:**
1. Check cache first
2. On cache miss, query database
3. Populate cache with result
4. Return data to client

**Graceful Degradation:**
- If Redis is unavailable, requests bypass cache and go directly to the database
- No errors are thrown to the client
- System remains fully functional

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Redis Cache Configuration
REDIS_HOST=localhost          # Redis server host
REDIS_PORT=6379              # Redis server port
REDIS_PASSWORD=              # Redis password (optional)
REDIS_DB=0                   # Redis database number (0-15)
CACHE_ENABLED=true           # Enable/disable caching
```

### Redis Installation

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run --name redis -p 6379:6379 -d redis:alpine
```

## Cache Keys Structure

All cache keys follow a consistent naming convention with versioning:

### Key Format
```
{prefix}:{suffix}:{param1}:{value1}:{param2}:{value2}:{version}
```

### Examples

**Banners:**
```
banners:page:1:limit:10:v1
```

**Categories:**
```
categories:limit:20:page:1:sort:name:v1
```

**Products by Category:**
```
products:category:507f1f77bcf86cd799439011:limit:4:page:1:v1
```

**New Arrivals (Last 14 days):**
```
products:createdAt[gte]:2026-01-17T00:00:00.000Z:limit:4:page:1:sort:-createdAt:v1
```

**Active Reels:**
```
reels:active:v1
```

## TTL Settings

Different data types have different Time-To-Live (TTL) settings based on their volatility:

| Resource | Endpoint | TTL | Reason |
|----------|----------|-----|--------|
| Banners | `/api/banners` | 1 hour (3600s) | Rarely change |
| Categories | `/api/categories` | 6 hours (21600s) | Very stable |
| Products | `/api/products?category={id}` | 30 minutes (1800s) | Moderate updates |
| New Arrivals | `/api/products?createdAt[gte]=...` | 15 minutes (900s) | Frequently updated |
| Active Reels | `/api/reels/active` | 1 hour (3600s) | Rarely change |

## API Endpoints

### Cached Endpoints

#### 1. Banners
```http
GET /api/banners?page=1&limit=10
Cache-Key: banners:page:1:limit:10:v1
TTL: 3600 seconds (1 hour)
```

#### 2. Categories
```http
GET /api/categories?page=1&limit=20&sort=name
Cache-Key: categories:limit:20:page:1:sort:name:v1
TTL: 21600 seconds (6 hours)
```

#### 3. Products by Category
```http
GET /api/products?category=507f1f77bcf86cd799439011&limit=4
Cache-Key: products:category:507f1f77bcf86cd799439011:limit:4:page:1:v1
TTL: 1800 seconds (30 minutes)
```

#### 4. New Arrivals
```http
GET /api/products?createdAt[gte]=2026-01-17T00:00:00.000Z&sort=-createdAt&limit=4
Cache-Key: products:createdAt[gte]:2026-01-17T00:00:00.000Z:limit:4:page:1:sort:-createdAt:v1
TTL: 900 seconds (15 minutes)
```

#### 5. Active Reels
```http
GET /api/reels/active
Cache-Key: reels:active:v1
TTL: 3600 seconds (1 hour)
```

### Cache Management Endpoints

All cache management endpoints require authentication.

#### 1. Health Check (Public)
```http
GET /api/cache/health

Response:
{
  "success": true,
  "data": {
    "redis": {
      "connected": true,
      "dbSize": 42,
      "hits": 1523,
      "misses": 234,
      "hitRate": "86.69%",
      "memoryUsed": "1.2M",
      "totalConnections": 156
    }
  },
  "message": "Redis is healthy"
}
```

#### 2. Cache Statistics (Admin)
```http
GET /api/cache/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "connected": true,
    "dbSize": 42,
    "hits": 1523,
    "misses": 234,
    "hitRate": "86.69%",
    "memoryUsed": "1.2M",
    "totalConnections": 156
  }
}
```

#### 3. Flush All Cache (Admin)
```http
POST /api/cache/flush
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "All cache cleared successfully"
}
```

#### 4. Invalidate Specific Resource Cache (Admin)
```http
POST /api/cache/invalidate/:resourceType
Authorization: Bearer {token}

# Resource types: banners, categories, products, reels

# Example: Invalidate all product caches
POST /api/cache/invalidate/products

# Example: Invalidate products for specific category
POST /api/cache/invalidate/products
Content-Type: application/json
{
  "categoryId": "507f1f77bcf86cd799439011"
}

Response:
{
  "success": true,
  "message": "Cache for products invalidated successfully"
}
```

#### 5. Warm Critical Caches (Admin)
```http
POST /api/cache/warm
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Cache warming initiated in background"
}
```

## Cache Invalidation

### Automatic Invalidation

Cache is automatically invalidated when data is modified:

#### Banner Operations
- `POST /api/banners` → Clears all banner caches
- `PATCH /api/banners/:id` → Clears all banner caches
- `DELETE /api/banners/:id` → Clears all banner caches

#### Category Operations
- `POST /api/categories` → Clears category and related product caches
- `PATCH /api/categories/:id` → Clears category and related product caches
- `DELETE /api/categories/:id` → Clears category and related product caches

#### Product Operations
- `POST /api/products` → Clears product caches (category-specific and new arrivals)
- `PATCH /api/products/:id` → Clears product caches
- `DELETE /api/products/:id` → Clears all product caches

#### Reel Operations
- `POST /api/reels` → Clears all reel caches
- `PATCH /api/reels/:id` → Clears all reel caches
- `PATCH /api/reels/:id/toggle-visibility` → Clears all reel caches
- `DELETE /api/reels/:id` → Clears all reel caches

### Manual Invalidation

Use the cache invalidation endpoint for manual cache clearing:

```bash
# Clear all banner caches
curl -X POST http://localhost:5000/api/cache/invalidate/banners \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear product caches for specific category
curl -X POST http://localhost:5000/api/cache/invalidate/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryId": "507f1f77bcf86cd799439011"}'
```

## Monitoring and Management

### Cache Hit Rate

Monitor cache effectiveness through the `/api/cache/stats` endpoint:

```javascript
{
  "hitRate": "86.69%",  // Higher is better (target: >80%)
  "hits": 1523,         // Number of cache hits
  "misses": 234,        // Number of cache misses
}
```

### Performance Metrics

Monitor these metrics to optimize cache settings:

1. **Hit Rate**: Percentage of requests served from cache
   - Target: >80%
   - Action: Increase TTL if hit rate is low

2. **Memory Usage**: Redis memory consumption
   - Monitor: `memoryUsed` in stats
   - Action: Adjust TTL or clear old caches if memory is high

3. **Cache Size**: Number of keys in cache
   - Monitor: `dbSize` in stats
   - Action: Review cache key structure if size grows unexpectedly

### Cache Warming

Critical caches are automatically warmed on server startup:

- Banners (top 10)
- Categories (top 20)
- Active reels
- New arrivals (last 14 days, limit 4)

To manually trigger cache warming:
```bash
curl -X POST http://localhost:5000/api/cache/warm \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Unit Tests

Run the Redis caching test suite:

```bash
node test-redis-caching.js
```

This tests:
- Redis availability check
- Cache operations with graceful degradation
- Cache key generation
- Cache invalidation functions
- Cache statistics
- Cache middleware functionality

### Manual Testing

#### 1. Test Cache Hit/Miss

```bash
# First request (cache miss)
curl http://localhost:5000/api/banners
# Check logs for: "Cache miss"

# Second request (cache hit)
curl http://localhost:5000/api/banners
# Check logs for: "Cache hit"
```

#### 2. Test Cache Invalidation

```bash
# Create a new banner (requires auth token)
curl -X POST http://localhost:5000/api/banners \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "image": "url", "isActive": true}'

# Verify cache was cleared
curl http://localhost:5000/api/banners
# Check logs for: "Cache miss" (cache was invalidated)
```

#### 3. Test Graceful Degradation

```bash
# Stop Redis
sudo systemctl stop redis

# Make API request (should still work)
curl http://localhost:5000/api/banners
# Response should be normal, just without caching
```

## Troubleshooting

### Issue: Redis connection errors

**Symptoms:**
```
Redis client error: ECONNREFUSED
```

**Solution:**
1. Check if Redis is running: `redis-cli ping` (should return "PONG")
2. Verify Redis host and port in `.env`
3. Check firewall settings
4. Set `CACHE_ENABLED=false` to disable caching temporarily

### Issue: Cache not invalidating

**Symptoms:**
- Stale data after updates
- Old data persists after changes

**Solution:**
1. Check cache invalidation middleware is applied to routes
2. Manually clear cache: `curl -X POST http://localhost:5000/api/cache/flush`
3. Verify cache keys match between caching and invalidation
4. Check logs for invalidation errors

### Issue: Low cache hit rate

**Symptoms:**
- Hit rate below 70%
- Many cache misses

**Solution:**
1. Increase TTL for stable data
2. Review cache key generation (ensure consistency)
3. Check if data is frequently updated (may need shorter TTL)
4. Verify cache warming is working

### Issue: High memory usage

**Symptoms:**
- Redis memory growing too large
- `memoryUsed` increasing rapidly

**Solution:**
1. Reduce TTL for large objects
2. Review cached data size (check logs for "Large object being cached")
3. Implement cache key expiration policies
4. Consider adding compression for large responses
5. Flush old caches: `curl -X POST http://localhost:5000/api/cache/flush`

### Issue: Cache not warming on startup

**Symptoms:**
- No cache warming logs on startup
- First requests are slow

**Solution:**
1. Check if database is connected before warming
2. Verify `warmCriticalCaches()` is called in `server.js`
3. Check error logs for warming failures
4. Manually trigger warming: `curl -X POST http://localhost:5000/api/cache/warm`

## Best Practices

1. **Always use consistent cache keys**: Follow the established naming convention
2. **Set appropriate TTLs**: Balance between performance and data freshness
3. **Monitor cache hit rates**: Aim for >80% hit rate
4. **Implement graceful degradation**: Application should work without cache
5. **Log cache operations**: Use structured logging for monitoring
6. **Version cache keys**: Increment `CACHE_VERSION` when schema changes
7. **Warm critical caches**: Pre-populate frequently accessed data
8. **Test cache invalidation**: Ensure caches are cleared on data updates
9. **Monitor memory usage**: Keep Redis memory under control
10. **Use Redis in production**: Essential for horizontal scaling

## Production Deployment

### Recommended Redis Configuration

For production environments, use a managed Redis service:

- **AWS ElastiCache**: Managed Redis with automatic failover
- **Redis Labs**: Cloud-hosted Redis with clustering
- **Azure Cache for Redis**: Managed Redis on Azure
- **Google Cloud Memorystore**: Redis on Google Cloud

### Environment-Specific Settings

**Development:**
```bash
REDIS_HOST=localhost
CACHE_ENABLED=true
```

**Staging:**
```bash
REDIS_HOST=staging-redis.example.com
REDIS_PASSWORD=staging-password
CACHE_ENABLED=true
```

**Production:**
```bash
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6380
REDIS_PASSWORD=strong-production-password
REDIS_DB=0
CACHE_ENABLED=true
```

### Security Considerations

1. **Use strong Redis passwords** in production
2. **Restrict Redis network access** to application servers only
3. **Enable Redis AUTH** for authentication
4. **Use TLS/SSL** for Redis connections in production
5. **Regularly update Redis** to latest stable version
6. **Monitor Redis logs** for suspicious activity
7. **Implement rate limiting** on cache endpoints

## Support

For issues or questions:
- Check logs: `logger` outputs structured JSON logs
- Review Redis connection: `GET /api/cache/health`
- Check cache stats: `GET /api/cache/stats`
- Contact: [Your contact information]

## License

This implementation is part of the FakiraFab server project.
