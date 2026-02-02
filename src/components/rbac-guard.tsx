'use client'

import { useRBAC } from '@/hooks/use-rbac'
import { Loader2 } from 'lucide-react'

interface RBACGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RBACGuard({ children, fallback }: RBACGuardProps) {
  const { canAccess, isLoading } = useRBAC()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canAccess) {
    return fallback || null
  }

  return <>{children}</>
}
