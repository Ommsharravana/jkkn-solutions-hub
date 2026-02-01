'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// Input validation helpers
function validateEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

function validatePassword(password: unknown): password is string {
  if (typeof password !== 'string') return false
  return password.length >= 8 && password.length <= 128
}

function validateFullName(name: unknown): name is string {
  if (typeof name !== 'string') return false
  // Allow letters, spaces, hyphens, apostrophes, and common name characters
  const nameRegex = /^[\p{L}\s\-'.]+$/u
  return nameRegex.test(name) && name.length >= 1 && name.length <= 100
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  // Validate inputs
  if (!validateEmail(email)) {
    return { error: 'Invalid email address' }
  }

  if (!validatePassword(password)) {
    return { error: 'Password must be between 8 and 128 characters' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Don't expose detailed auth errors to prevent user enumeration
    return { error: 'Invalid email or password' }
  }

  redirect('/')
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const fullName = formData.get('full_name')

  // Validate inputs
  if (!validateEmail(email)) {
    return { error: 'Invalid email address' }
  }

  if (!validatePassword(password)) {
    return { error: 'Password must be between 8 and 128 characters' }
  }

  if (!validateFullName(fullName)) {
    return { error: 'Invalid name. Please use only letters, spaces, hyphens, and apostrophes.' }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    // Don't expose if email already exists
    return { error: 'Unable to create account. Please try again or use a different email.' }
  }

  return { success: true, message: 'Check your email to confirm your account.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email')

  // Validate email
  if (!validateEmail(email)) {
    return { error: 'Invalid email address' }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  // Always return success to prevent email enumeration attacks
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })

  return { success: true, message: 'If an account exists with this email, you will receive a password reset link.' }
}

export async function updatePassword(formData: FormData) {
  const newPassword = formData.get('password')

  // Validate password
  if (!validatePassword(newPassword)) {
    return { error: 'Password must be between 8 and 128 characters' }
  }

  const supabase = await createClient()

  // Verify user is authenticated before allowing password update
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to update your password' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: 'Failed to update password. Please try again.' }
  }

  return { success: true }
}
