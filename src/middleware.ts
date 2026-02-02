import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types/auth'

// Route access configuration
const ROUTE_ACCESS: Record<string, UserRole[]> = {
  // Portal routes - for external clients only
  '/portal': ['client'],

  // Builder routes - for software builders
  '/builder': ['builder', 'md_caio', 'jicate_staff'],

  // Cohort routes - for training cohort members
  '/cohort': ['cohort_member', 'md_caio', 'jicate_staff'],

  // Production routes - for content production learners
  '/production': ['production_learner', 'md_caio', 'jicate_staff'],

  // Department routes - for HODs and department staff
  '/department': ['department_head', 'department_staff', 'md_caio'],

  // Admin/dashboard routes - all internal staff
  '/solutions': ['md_caio', 'department_head', 'department_staff', 'jicate_staff'],
  '/clients': ['md_caio', 'department_head', 'department_staff', 'jicate_staff'],
  '/software': ['md_caio', 'department_head', 'department_staff', 'jicate_staff', 'builder'],
  '/training': ['md_caio', 'department_head', 'department_staff', 'jicate_staff', 'cohort_member'],
  '/content': ['md_caio', 'department_head', 'department_staff', 'jicate_staff', 'production_learner'],
  '/reports': ['md_caio', 'department_head', 'jicate_staff'],
  '/publications': ['md_caio', 'department_head', 'department_staff', 'jicate_staff'],
  '/payments': ['md_caio', 'jicate_staff'],
  '/earnings': ['md_caio', 'jicate_staff', 'builder', 'cohort_member', 'production_learner'],
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/webhooks',
  '/api/health',
  '/toast-test', // Public test page for toast notifications
]

// Role-based redirect destinations after login
const ROLE_REDIRECTS: Record<UserRole, string> = {
  md_caio: '/',
  department_head: '/department',
  department_staff: '/department',
  jicate_staff: '/',
  builder: '/builder',
  cohort_member: '/cohort',
  production_learner: '/production',
  client: '/portal',
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function getRequiredRoles(pathname: string): UserRole[] | null {
  // Check exact match first
  if (ROUTE_ACCESS[pathname]) {
    return ROUTE_ACCESS[pathname]
  }

  // Check prefix matches
  for (const [route, roles] of Object.entries(ROUTE_ACCESS)) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      return roles
    }
  }

  // Root path requires authentication but no specific role
  if (pathname === '/') {
    return null
  }

  return null
}

function getRedirectForRole(role: UserRole): string {
  return ROLE_REDIRECTS[role] || '/'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add CSP header to all responses
  const addCSPHeaders = (response: NextResponse) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'self'",
      "form-action 'self'",
    ].join('; ')

    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return addCSPHeaders(NextResponse.next())
  }

  // Create Supabase client with cookies
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not authenticated - redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch user profile and role
  const { data: profile } = await supabase
    .from('users')
    .select('role, user_type, is_active')
    .eq('id', user.id)
    .single()

  // If no profile, user needs to complete setup (shouldn't happen normally)
  if (!profile) {
    console.warn(`User ${user.id} has no profile`)
    // Create a default profile (this is a fallback)
    const metadata = user.user_metadata || {}
    const isInternal = user.email?.endsWith('@jkkn.ac.in') || false

    await supabase.from('users').upsert({
      id: user.id,
      email: user.email!,
      full_name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User',
      avatar_url: metadata.avatar_url || metadata.picture || null,
      role: isInternal ? 'department_staff' : 'client',
      user_type: isInternal ? 'internal' : 'external',
      auth_method: isInternal ? 'google_oauth' : 'email_password',
      is_active: true,
    })

    // Redirect to appropriate page based on new profile
    const redirectPath = isInternal ? '/department' : '/portal'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Check if user is active
  if (!profile.is_active) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('error', 'account_disabled')
    return NextResponse.redirect(loginUrl)
  }

  const userRole = profile.role as UserRole

  // Handle root path - redirect based on role
  if (pathname === '/') {
    const redirectPath = getRedirectForRole(userRole)
    if (redirectPath !== '/') {
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    // md_caio and jicate_staff can access root
    if (!['md_caio', 'jicate_staff'].includes(userRole)) {
      return NextResponse.redirect(new URL(getRedirectForRole(userRole), request.url))
    }
    return response
  }

  // Check route access
  const requiredRoles = getRequiredRoles(pathname)

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    // User doesn't have access to this route
    console.warn(`User ${user.id} with role ${userRole} denied access to ${pathname}`)

    // Redirect to their appropriate dashboard
    const redirectPath = getRedirectForRole(userRole)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Add user role to response headers for potential server component use
  response.headers.set('x-user-role', userRole)
  response.headers.set('x-user-type', profile.user_type)

  return addCSPHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
