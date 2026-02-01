/**
 * JKKN Solutions Hub - Auth Types
 */

import { User as SupabaseUser } from '@supabase/supabase-js'

// User roles as defined in spec
export type UserRole =
  | 'md_caio'           // MD/CAIO - master access
  | 'department_head'   // Department Head
  | 'department_staff'  // Department Staff
  | 'builder'           // Builder (software talent)
  | 'cohort_member'     // Cohort Member (training talent)
  | 'production_learner' // Production Learner (content talent)
  | 'jicate_staff'      // JICATE Staff
  | 'client'            // External client

// Authentication method
export type AuthMethod = 'google_oauth' | 'email_password'

// User type based on authentication
export type UserType = 'internal' | 'external'

// Extended user profile stored in Supabase
export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  user_type: UserType
  auth_method: AuthMethod
  department_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Minimal user for context (derived from profile + auth)
export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: UserRole
  userType: UserType
  departmentId: string | null
}

// Auth context state
export interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
}

// Auth context actions
export interface AuthActions {
  signInWithGoogle: () => Promise<{ error?: string }>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string; message?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>
  updatePassword: (newPassword: string) => Promise<{ error?: string }>
}

export type AuthContextValue = AuthState & AuthActions

// Helper to check if user is internal (MyJKKN SSO)
export function isInternalUser(user: AuthUser | null): boolean {
  return user?.userType === 'internal'
}

// Helper to check if user is external (email/password)
export function isExternalUser(user: AuthUser | null): boolean {
  return user?.userType === 'external'
}

// Role-based access helpers
export function canAccessAdminDashboard(role: UserRole | undefined): boolean {
  return role === 'md_caio' || role === 'jicate_staff'
}

export function canAccessDepartmentDashboard(role: UserRole | undefined): boolean {
  return role === 'department_head' || role === 'department_staff'
}

export function isStaffRole(role: UserRole | undefined): boolean {
  return ['md_caio', 'department_head', 'department_staff', 'jicate_staff'].includes(role || '')
}

export function isTalentRole(role: UserRole | undefined): boolean {
  return ['builder', 'cohort_member', 'production_learner'].includes(role || '')
}
