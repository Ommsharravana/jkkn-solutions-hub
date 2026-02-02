import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
})

// Query keys factory for consistent cache keys
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  user: (userId: string) => ['user', userId] as const,

  // Departments
  departments: ['departments'] as const,
  departmentsWithStats: ['departments', 'with-stats'] as const,
  department: (id: string) => ['departments', id] as const,

  // Talent
  talent: ['talent'] as const,
  talentSummary: ['talent', 'summary'] as const,
  builders: (filters?: Record<string, unknown>) => ['talent', 'builders', filters] as const,
  cohort: (filters?: Record<string, unknown>) => ['talent', 'cohort', filters] as const,
  production: (filters?: Record<string, unknown>) => ['talent', 'production', filters] as const,

  // Solutions
  solutions: (filters?: Record<string, unknown>) => ['solutions', filters] as const,
  solution: (id: string) => ['solutions', id] as const,

  // Clients
  clients: (filters?: Record<string, unknown>) => ['clients', filters] as const,
  client: (id: string) => ['clients', id] as const,

  // Profile
  profile: (userId: string) => ['profile', userId] as const,
  myRoles: (userId: string) => ['profile', userId, 'roles'] as const,

  // Earnings
  earnings: (userId: string) => ['earnings', userId] as const,

  // Payments
  payments: (filters?: Record<string, unknown>) => ['payments', filters] as const,
}

// Invalidation helpers
export const invalidateQueries = {
  departments: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments }),
  talent: () => queryClient.invalidateQueries({ queryKey: queryKeys.talent }),
  solutions: () => queryClient.invalidateQueries({ queryKey: ['solutions'] }),
  clients: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  profile: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) }),
}
