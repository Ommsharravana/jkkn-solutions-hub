'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDiscoveryVisits,
  getDiscoveryVisitById,
  getClientDiscoveryVisits,
  createDiscoveryVisit,
  updateDiscoveryVisit,
  deleteDiscoveryVisit,
  linkVisitToResult,
  type DiscoveryVisitFilters,
  type CreateDiscoveryVisitInput,
  type UpdateDiscoveryVisitInput,
} from '@/services/discovery-visits'

/**
 * Hook to fetch all discovery visits with optional filters
 */
export function useDiscoveryVisits(filters?: DiscoveryVisitFilters) {
  return useQuery({
    queryKey: ['discovery-visits', filters],
    queryFn: () => getDiscoveryVisits(filters),
  })
}

/**
 * Hook to fetch a single discovery visit by ID
 */
export function useDiscoveryVisit(id: string) {
  return useQuery({
    queryKey: ['discovery-visits', id],
    queryFn: () => getDiscoveryVisitById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch discovery visits for a specific client
 */
export function useClientDiscoveryVisits(clientId: string) {
  return useQuery({
    queryKey: ['discovery-visits', 'client', clientId],
    queryFn: () => getClientDiscoveryVisits(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to create a new discovery visit
 */
export function useCreateDiscoveryVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDiscoveryVisitInput) => createDiscoveryVisit(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-visits'] })
      // Also invalidate client-specific queries
      queryClient.invalidateQueries({ queryKey: ['discovery-visits', 'client', data.client_id] })
    },
  })
}

/**
 * Hook to update an existing discovery visit
 */
export function useUpdateDiscoveryVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateDiscoveryVisitInput }) =>
      updateDiscoveryVisit(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-visits'] })
      queryClient.setQueryData(['discovery-visits', data.id], data)
    },
  })
}

/**
 * Hook to delete a discovery visit
 */
export function useDeleteDiscoveryVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDiscoveryVisit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-visits'] })
    },
  })
}

/**
 * Hook to link a visit to a resulting solution/phase
 */
export function useLinkVisitToResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      visitId,
      solutionId,
      phaseId,
    }: {
      visitId: string
      solutionId: string
      phaseId?: string
    }) => linkVisitToResult(visitId, solutionId, phaseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-visits'] })
      queryClient.setQueryData(['discovery-visits', data.id], data)
    },
  })
}
