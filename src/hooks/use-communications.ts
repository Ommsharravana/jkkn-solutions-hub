'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCommunications,
  getCommunicationById,
  getClientCommunications,
  getSolutionCommunications,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  type CommunicationFilters,
  type CreateCommunicationInput,
  type UpdateCommunicationInput,
} from '@/services/communications'

/**
 * Hook to fetch all communications with optional filters
 */
export function useCommunications(filters?: CommunicationFilters) {
  return useQuery({
    queryKey: ['communications', filters],
    queryFn: () => getCommunications(filters),
  })
}

/**
 * Hook to fetch a single communication by ID
 */
export function useCommunication(id: string) {
  return useQuery({
    queryKey: ['communications', id],
    queryFn: () => getCommunicationById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch communications for a specific client
 */
export function useClientCommunications(clientId: string) {
  return useQuery({
    queryKey: ['communications', 'client', clientId],
    queryFn: () => getClientCommunications(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to fetch communications for a specific solution
 */
export function useSolutionCommunications(solutionId: string) {
  return useQuery({
    queryKey: ['communications', 'solution', solutionId],
    queryFn: () => getSolutionCommunications(solutionId),
    enabled: !!solutionId,
  })
}

/**
 * Hook to create a new communication
 */
export function useCreateCommunication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCommunicationInput) => createCommunication(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communications'] })
      // Also invalidate client-specific queries
      queryClient.invalidateQueries({ queryKey: ['communications', 'client', data.client_id] })
      if (data.solution_id) {
        queryClient.invalidateQueries({ queryKey: ['communications', 'solution', data.solution_id] })
      }
    },
  })
}

/**
 * Hook to update an existing communication
 */
export function useUpdateCommunication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCommunicationInput }) =>
      updateCommunication(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communications'] })
      queryClient.setQueryData(['communications', data.id], data)
    },
  })
}

/**
 * Hook to delete a communication
 */
export function useDeleteCommunication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCommunication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] })
    },
  })
}
