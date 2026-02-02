import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/auth'

// Allowed origins for redirect (prevents open redirect attacks)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean)

// Internal email domains (JKKN staff)
const INTERNAL_DOMAINS = ['jkkn.ac.in', 'jkkn.edu.in', 'jkkn.org']

// Role-based redirect destinations
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

function getSafeOrigin(requestUrl: URL): string {
  const origin = requestUrl.origin
  // In production, use the configured app URL; in dev, allow localhost
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin
  }
  // Fallback to configured app URL or localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function isInternalEmail(email: string | undefined): boolean {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  return INTERNAL_DOMAINS.includes(domain)
}

function getRedirectForRole(role: UserRole): string {
  return ROLE_REDIRECTS[role] || '/'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const type = requestUrl.searchParams.get('type') // 'recovery', 'signup', 'invite', etc.
  const origin = getSafeOrigin(requestUrl)

  // Handle OAuth error
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  // Exchange code for session
  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
    }

    // If user signed in successfully, ensure they have a profile
    if (data.user) {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', data.user.id)
        .single()

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const metadata = data.user.user_metadata || {}
        const provider = data.user.app_metadata?.provider
        const email = data.user.email

        // Determine if internal user based on email domain
        const isInternal = isInternalEmail(email)
        const isGoogleAuth = provider === 'google'

        // Set user type based on email domain (not just auth method)
        const userType = isInternal ? 'internal' : 'external'

        // Default role based on user type:
        // - Internal users (JKKN email) get 'department_staff' as default
        // - External users (clients) get 'client' role
        const defaultRole: UserRole = isInternal ? 'department_staff' : 'client'

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: metadata.full_name || metadata.name || email?.split('@')[0] || '',
            avatar_url: metadata.avatar_url || metadata.picture || null,
            role: defaultRole,
            user_type: userType,
            auth_method: isGoogleAuth ? 'google_oauth' : 'email_password',
            is_active: true,
          })

        if (insertError) {
          console.error('Profile creation error:', insertError)
          // Don't fail the login, just log the error
        }

        // Redirect based on auth type or role
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/auth/reset-password`)
        }

        // Redirect new users to their role-appropriate dashboard
        return NextResponse.redirect(`${origin}${getRedirectForRole(defaultRole)}`)
      }

      // Existing user - redirect based on their role
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      const userRole = existingProfile.role as UserRole
      return NextResponse.redirect(`${origin}${getRedirectForRole(userRole)}`)
    }

    // Redirect based on auth type
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    // Default: redirect to dashboard (middleware will handle role-based redirect)
    return NextResponse.redirect(`${origin}/`)
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
