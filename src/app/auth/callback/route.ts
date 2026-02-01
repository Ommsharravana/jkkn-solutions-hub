import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

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
        .select('id')
        .eq('id', data.user.id)
        .single()

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const metadata = data.user.user_metadata || {}
        const provider = data.user.app_metadata?.provider

        // Determine user type based on provider
        const isGoogleAuth = provider === 'google'
        const userType = isGoogleAuth ? 'internal' : 'external'

        // Default role: internal users get 'department_staff', external get 'client'
        const defaultRole = isGoogleAuth ? 'department_staff' : 'client'

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: metadata.full_name || metadata.name || data.user.email?.split('@')[0] || '',
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
      }
    }

    // Redirect to dashboard
    return NextResponse.redirect(`${origin}/`)
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
