'use client'

// Re-export the hook from the provider for convenience
export { useAuth } from '@/components/providers/auth-provider'

// Additional auth-related hooks can be added here
import { useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { isInternalUser, isExternalUser, canAccessAdminDashboard, isStaffRole, isTalentRole } from '@/types/auth'

/**
 * Hook to check various permissions based on user role
 */
export function usePermissions() {
  const { user } = useAuth()

  const isInternal = useCallback(() => isInternalUser(user), [user])
  const isExternal = useCallback(() => isExternalUser(user), [user])
  const canAccessAdmin = useCallback(() => canAccessAdminDashboard(user?.role), [user])
  const isStaff = useCallback(() => isStaffRole(user?.role), [user])
  const isTalent = useCallback(() => isTalentRole(user?.role), [user])

  const hasRole = useCallback((roles: string | string[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }, [user])

  return {
    isInternal,
    isExternal,
    canAccessAdmin,
    isStaff,
    isTalent,
    hasRole,
  }
}
