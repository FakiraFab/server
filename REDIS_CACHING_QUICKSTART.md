# Redis Caching Implementation - Quick Start Guide

This implementation adds comprehensive Redis caching to the FakiraFab e-commerce backend API.

## 🚀 Quick Setup

### 1. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
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

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
CACHE_ENABLED=true
```

### 3. Start the Server

```bash
npm install
npm run dev
```

The server will:
- Connect to Redis automatically
- Warm critical caches on startup
- Log cache hits/misses for monitoring

## ✅ What's Cached

| Endpoint | TTL | Cache Key Example |
|----------|-----|-------------------|
| `GET /api/banners` | 1 hour | `banners:page:1:limit:10:v1` |
| `GET /api/categories` | 6 hours | `categories:limit:20:page:1:sort:name:v1` |
| `GET /api/products?category=...` | 30 min | `products:category:123:limit:4:page:1:v1` |
| `GET /api/products?createdAt[gte]=...` | 15 min | `products:createdAt[gte]:2026-01-17:limit:4:v1` |
| `GET /api/reels/active` | 1 hour | `reels:active:v1` |

## 🛠️ Cache Management API

### Health Check (Public)
```bash
curl http://localhost:5000/api/cache/health
```

### Get Statistics (Admin)
```bash
curl http://localhost:5000/api/cache/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Clear All Cache (Admin)
```bash
curl -X POST http://localhost:5000/api/cache/flush \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Invalidate Specific Resource (Admin)
```bash
# Clear product caches
curl -X POST http://localhost:5000/api/cache/invalidate/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear product caches for specific category
curl -X POST http://localhost:5000/api/cache/invalidate/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryId": "507f1f77bcf86cd799439011"}'
```

### Warm Caches (Admin)
```bash
curl -X POST http://localhost:5000/api/cache/warm \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Automatic Cache Invalidation

Cache is automatically cleared when you:
- Create, update, or delete banners → clears banner caches
- Create, update, or delete categories → clears category + related product caches
- Create, update, or delete products → clears product + new arrivals caches
- Create, update, or delete reels → clears reel caches

No manual intervention required!

## 🧪 Testing

Run the test suite:

```bash
# Test caching functionality with graceful degradation
node test-redis-caching.js

# Test middleware integration
node test-cache-middleware-integration.js
```

## 📊 Monitoring

Check the application logs for cache activity:

```json
{"level":"info","message":"Cache hit","key":"banners:page:1:limit:10:v1"}
{"level":"info","message":"Cache miss","key":"products:category:123:limit:4:v1"}
{"level":"info","message":"Cache set","key":"reels:active:v1","ttl":3600}
{"level":"info","message":"Cache pattern deleted","pattern":"products:*:v1","count":15}
```

### Key Metrics to Monitor

1. **Cache Hit Rate**: Should be >80%
   - Check via `/api/cache/stats`
   - Low hit rate? Increase TTL

2. **Memory Usage**: Keep under control
   - Check via `/api/cache/stats`
   - High memory? Reduce TTL or flush old caches

3. **Response Times**: Should improve significantly
   - First request: Database query (slower)
   - Subsequent requests: Cache hit (faster)

## 🔒 Graceful Degradation

**The application works perfectly even without Redis!**

If Redis is unavailable:
- ✅ Application continues to function normally
- ✅ All requests go directly to the database
- ✅ No errors shown to users
- ✅ Cache operations are safely skipped

To test this, set `CACHE_ENABLED=false` in your `.env`.

## 📖 Full Documentation

For complete details, see [REDIS_CACHING_DOCUMENTATION.md](./REDIS_CACHING_DOCUMENTATION.md)

Topics covered:
- Architecture and design patterns
- Cache key structure and versioning
- TTL settings and reasoning
- Cache invalidation strategies
- Troubleshooting guide
- Production deployment tips
- Security considerations

## 🎯 Key Features

- ✅ **Cache-Aside Pattern**: Check cache first, query DB on miss
- ✅ **Automatic Invalidation**: Clears cache on data changes
- ✅ **Cache Warming**: Pre-populates critical data on startup
- ✅ **Graceful Degradation**: Works without Redis
- ✅ **Admin Tools**: Health checks, stats, manual flush
- ✅ **Structured Logging**: Monitor cache performance
- ✅ **Version Control**: Handle schema changes easily
- ✅ **Production Ready**: SCAN instead of KEYS, retry logic, connection pooling

## 🚨 Important Notes

1. **Redis is optional but recommended** for production
2. **Cache is automatically invalidated** on data changes
3. **Monitor cache hit rates** via `/api/cache/stats`
4. **Increment CACHE_VERSION** in `middleware/cache.js` when changing data structure
5. **Use managed Redis** (ElastiCache, Redis Labs, etc.) in production

## 💡 Performance Impact

Expected improvements:
- **Banners**: ~200ms → ~5ms (40x faster)
- **Categories**: ~150ms → ~5ms (30x faster)
- **Products**: ~300ms → ~5ms (60x faster)
- **Reels**: ~100ms → ~5ms (20x faster)

Actual performance depends on:
- Database query complexity
- Network latency
- Data size
- Redis configuration

## 🤝 Support

If you encounter issues:

1. Check Redis is running: `redis-cli ping`
2. Verify environment variables in `.env`
3. Check application logs for errors
4. Test with `CACHE_ENABLED=false` to isolate issues
5. Review [REDIS_CACHING_DOCUMENTATION.md](./REDIS_CACHING_DOCUMENTATION.md)

---

**Implementation Status**: ✅ Complete and Production Ready

All features from the requirements have been successfully implemented and tested.
