'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deactivateClient,
  reactivateClient,
  incrementReferralCount,
  getClientIndustries,
  type ClientFilters,
  type CreateClientInput,
  type UpdateClientInput,
} from '@/services/clients'

/**
 * Hook to fetch all clients with optional filters
 */
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => getClients(filters),
  })
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => getClientById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch unique industries for filter dropdown
 */
export function useClientIndustries() {
  return useQuery({
    queryKey: ['clients', 'industries'],
    queryFn: getClientIndustries,
  })
}

/**
 * Hook to create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateClientInput) => createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

/**
 * Hook to update an existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateClientInput }) =>
      updateClient(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.setQueryData(['clients', data.id], data)
    },
  })
}

/**
 * Hook to deactivate a client
 */
export function useDeactivateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

/**
 * Hook to reactivate a client
 */
export function useReactivateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => reactivateClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

/**
 * Hook to increment referral count
 */
export function useIncrementReferralCount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => incrementReferralCount(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.setQueryData(['clients', data.id], data)
    },
  })
}
