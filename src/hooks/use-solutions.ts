'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSolutions,
  getSolutionById,
  createSolution,
  updateSolution,
  deleteSolution,
  getSolutionStats,
  type SolutionFilters,
  type CreateSolutionInput,
  type UpdateSolutionInput,
} from '@/services/solutions'

export function useSolutions(filters?: SolutionFilters) {
  return useQuery({
    queryKey: ['solutions', filters],
    queryFn: () => getSolutions(filters),
  })
}

export function useSolution(id: string) {
  return useQuery({
    queryKey: ['solutions', id],
    queryFn: () => getSolutionById(id),
    enabled: !!id,
  })
}

export function useSolutionStats() {
  return useQuery({
    queryKey: ['solutions', 'stats'],
    queryFn: getSolutionStats,
  })
}

export function useCreateSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSolutionInput) => createSolution(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions'] })
    },
  })
}

export function useUpdateSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSolutionInput }) =>
      updateSolution(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solutions'] })
      queryClient.setQueryData(['solutions', data.id], data)
    },
  })
}

export function useDeleteSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSolution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions'] })
    },
  })
}
