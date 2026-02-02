import { NextResponse, type NextRequest } from 'next/server'
import { apiLimiter, authLimiter } from './rate-limit'

export type ApiHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response>

interface RateLimitConfig {
  limit: number
  windowMs?: number
}

export function withRateLimit(
  handler: ApiHandler,
  config: RateLimitConfig = { limit: 60 }
): ApiHandler {
  return async (request, context) => {
    // Get client identifier
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'anonymous'
    const token = `${ip}-${request.nextUrl.pathname}`

    const { success, remaining } = await apiLimiter.check(config.limit, token)

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        }
      )
    }

    const response = await handler(request, context)

    // Add rate limit headers to response
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('X-RateLimit-Limit', config.limit.toString())
    newResponse.headers.set('X-RateLimit-Remaining', remaining.toString())

    return newResponse
  }
}

export function withAuthRateLimit(
  handler: ApiHandler,
  limit: number = 5
): ApiHandler {
  return async (request, context) => {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'anonymous'

    const { success } = await authLimiter.check(limit, ip)

    if (!success) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': '900',
          },
        }
      )
    }

    return handler(request, context)
  }
}
