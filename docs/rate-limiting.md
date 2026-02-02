# Rate Limiting

The JKKN Solutions Hub implements rate limiting on API routes to prevent abuse and ensure fair usage.

## Implementation

Rate limiting is implemented using an LRU (Least Recently Used) cache with time-based expiration.

### Files

- `/src/lib/rate-limit.ts` - Core rate limiting logic
- `/src/lib/api-middleware.ts` - Express-style middleware wrappers for Next.js API routes
- `/src/app/api/health/route.ts` - Example usage

## Pre-configured Limiters

Three pre-configured limiters are available:

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `apiLimiter` | 60 seconds | 500 unique tokens | Standard API endpoints |
| `authLimiter` | 15 minutes | 100 unique tokens | Authentication endpoints |
| `searchLimiter` | 60 seconds | 200 unique tokens | Search/query endpoints |

## Usage

### Standard API Endpoint

```typescript
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-middleware'

async function handler() {
  return NextResponse.json({ message: 'Success' })
}

// Apply rate limit: 60 requests per minute (default)
export const GET = withRateLimit(handler)

// Custom limit: 100 requests per minute
export const POST = withRateLimit(handler, { limit: 100 })
```

### Authentication Endpoint

```typescript
import { withAuthRateLimit } from '@/lib/api-middleware'

async function handler(request: NextRequest) {
  // Auth logic
  return NextResponse.json({ success: true })
}

// Apply auth rate limit: 5 attempts per 15 minutes (default)
export const POST = withAuthRateLimit(handler)

// Custom limit: 10 attempts per 15 minutes
export const POST = withAuthRateLimit(handler, 10)
```

## Rate Limit Headers

All rate-limited responses include these headers:

```
X-RateLimit-Limit: 100          # Maximum requests allowed
X-RateLimit-Remaining: 95       # Requests remaining in window
```

When rate limit is exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60                 # Seconds until retry allowed
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0

{
  "error": "Too many requests. Please try again later."
}
```

## Client Identification

Rate limits are tracked per client using:

1. `X-Forwarded-For` header (if behind proxy)
2. Request IP address
3. Request pathname

Combined token format: `{ip}-{pathname}`

## Testing Rate Limits

Test the health endpoint:

```bash
# Make a request
curl -i http://localhost:3000/api/health

# Check headers
curl -i http://localhost:3000/api/health 2>&1 | grep x-ratelimit

# Test multiple requests
for i in {1..5}; do
  echo "Request $i:"
  curl -s -i http://localhost:3000/api/health | grep x-ratelimit-remaining
done
```

## Middleware Configuration

The `/api/health` endpoint is public (no auth required). To make other API routes public, add them to `PUBLIC_ROUTES` in `/src/middleware.ts`:

```typescript
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/api/webhooks',
  '/api/health',        // Added for health checks
]
```

## Custom Rate Limiters

Create custom limiters for specific use cases:

```typescript
import { rateLimit } from '@/lib/rate-limit'

// Heavy operations: 10 requests per 5 minutes
export const heavyOpLimiter = rateLimit({
  interval: 5 * 60 * 1000,
  uniqueTokenPerInterval: 100,
})

// Use in middleware
export function withHeavyOpLimit(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const { success, remaining } = await heavyOpLimiter.check(10, ip)

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    return handler(request, context)
  }
}
```

## Best Practices

1. **Choose appropriate limits** - Balance security with user experience
2. **Use specific limiters** - Auth endpoints need stricter limits than read-only APIs
3. **Include rate limit headers** - Help clients understand their usage
4. **Log rate limit violations** - Monitor for abuse patterns
5. **Consider user roles** - Authenticated users might get higher limits

## Dependencies

- `lru-cache` (v11.2.5) - High-performance in-memory cache with TTL support
