export type UserRole = 'md' | 'hod' | 'council' | 'finance' | 'client' | 'builder' | 'cohort' | 'production'

// Define which roles can access which routes
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin routes - MD only
  '/departments': ['md', 'hod'],
  '/talent': ['md', 'hod', 'council'],
  '/settings': ['md', 'hod', 'council', 'finance', 'client', 'builder', 'cohort', 'production'], // All can access own settings

  // Main dashboard routes
  '/': ['md', 'hod', 'council', 'finance'], // Main dashboard
  '/clients': ['md', 'hod', 'council'],
  '/discovery': ['md', 'hod'],
  '/solutions': ['md', 'hod', 'council'],
  '/software': ['md', 'hod'],
  '/training': ['md', 'hod', 'council'],
  '/content': ['md', 'hod'],
  '/payments': ['md', 'finance'],
  '/publications': ['md', 'hod', 'council'],
  '/reports': ['md', 'hod', 'council', 'finance'],

  // Role-specific portals
  '/client': ['client'],
  '/builder': ['builder'],
  '/cohort': ['cohort'],
  '/production': ['production'],
  '/department': ['hod'],
  '/finance': ['finance'],
  '/council': ['council'],
}

export function canAccessRoute(userRole: UserRole | null, pathname: string): boolean {
  if (!userRole) return false

  // Find matching route (handle dynamic routes)
  const route = Object.keys(ROUTE_PERMISSIONS).find(r =>
    pathname === r || pathname.startsWith(r + '/')
  )

  if (!route) return true // Allow unlisted routes (404 will handle)

  return ROUTE_PERMISSIONS[route].includes(userRole)
}

export function getDefaultRoute(userRole: UserRole): string {
  switch (userRole) {
    case 'md': return '/'
    case 'hod': return '/department'
    case 'council': return '/council'
    case 'finance': return '/finance'
    case 'client': return '/client'
    case 'builder': return '/builder'
    case 'cohort': return '/cohort'
    case 'production': return '/production'
    default: return '/'
  }
}
