'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import type { AuthContextValue, AuthUser, UserRole, UserType } from '@/types/auth'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const supabase = createClient()

  // Transform Supabase user to AuthUser
  const transformUser = useCallback(async (supabaseUser: User | null): Promise<AuthUser | null> => {
    if (!supabaseUser) return null

    // Try to fetch user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    if (profile) {
      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        role: profile.role as UserRole,
        userType: profile.user_type as UserType,
        departmentId: profile.department_id,
      }
    }

    // Fallback: construct from Supabase user metadata
    const metadata = supabaseUser.user_metadata || {}
    const provider = supabaseUser.app_metadata?.provider

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName: metadata.full_name || metadata.name || supabaseUser.email?.split('@')[0] || '',
      avatarUrl: metadata.avatar_url || null,
      role: 'client' as UserRole, // Default for new users
      userType: provider === 'google' ? 'internal' : 'external',
      departmentId: null,
    }
  }, [supabase])

  // Initialize auth state
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()
        const authUser = await transformUser(supabaseUser)
        if (isMounted) {
          setUser(authUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const authUser = await transformUser(session?.user || null)
        if (isMounted) {
          setUser(authUser)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, transformUser])

  // Sign in with Google (MyJKKN SSO)
  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to sign in with Google' }
    }
  }, [supabase])

  // Sign in with email/password (external users)
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to sign in' }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Sign up with email/password (external users - clients)
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error: error.message }
      }

      return { message: 'Check your email to confirm your account.' }
    } catch (error) {
      return { error: 'Failed to create account' }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        // Still clear local state even if server signout fails
        // This ensures the user can attempt to sign in again
      }
      setUser(null)
    } catch (error) {
      console.error('Sign out exception:', error)
      // Clear local state on any error to allow re-authentication
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Reset password (send email)
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { error: error.message }
      }

      return { message: 'Check your email for a password reset link.' }
    } catch (error) {
      return { error: 'Failed to send reset email' }
    }
  }, [supabase])

  // Update password (after reset)
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Failed to update password' }
    }
  }, [supabase])

  const value: AuthContextValue = {
    user,
    loading,
    initialized,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
