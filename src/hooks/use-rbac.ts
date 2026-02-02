'use client'

import { useAuth } from '@/hooks/use-auth'
import { canAccessRoute, getDefaultRoute, type UserRole } from '@/lib/rbac'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useRBAC() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const userRole = user?.role as UserRole | undefined

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (userRole && !canAccessRoute(userRole, pathname)) {
      // Redirect to their default portal
      router.push(getDefaultRoute(userRole))
    }
  }, [user, userRole, pathname, loading, router])

  return {
    userRole,
    canAccess: userRole ? canAccessRoute(userRole, pathname) : false,
    isLoading: loading,
  }
}
