'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPhases,
  getPhaseById,
  getPhasesBySolution,
  createPhase,
  updatePhase,
  deletePhase,
  getNextPhaseNumber,
  getPhaseStats,
  createIteration,
  updateIteration,
  createBugReport,
  updateBugReport,
  createDeployment,
  type PhaseFilters,
  type CreatePhaseInput,
  type UpdatePhaseInput,
  type CreateIterationInput,
  type CreateBugReportInput,
  type CreateDeploymentInput,
} from '@/services/phases'
import type { PrototypeIteration, BugReport } from '@/types/database'

export function usePhases(filters?: PhaseFilters) {
  return useQuery({
    queryKey: ['phases', filters],
    queryFn: () => getPhases(filters),
  })
}

export function usePhase(id: string) {
  return useQuery({
    queryKey: ['phases', id],
    queryFn: () => getPhaseById(id),
    enabled: !!id,
  })
}

export function useSolutionPhases(solutionId: string) {
  return useQuery({
    queryKey: ['phases', 'solution', solutionId],
    queryFn: () => getPhasesBySolution(solutionId),
    enabled: !!solutionId,
  })
}

export function usePhaseStats() {
  return useQuery({
    queryKey: ['phases', 'stats'],
    queryFn: getPhaseStats,
  })
}

export function useNextPhaseNumber(solutionId: string) {
  return useQuery({
    queryKey: ['phases', 'next-number', solutionId],
    queryFn: () => getNextPhaseNumber(solutionId),
    enabled: !!solutionId,
  })
}

export function useCreatePhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePhaseInput) => createPhase(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      queryClient.invalidateQueries({ queryKey: ['phases', 'solution', data.solution_id] })
    },
  })
}

export function useUpdatePhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePhaseInput }) =>
      updatePhase(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      queryClient.setQueryData(['phases', data.id], data)
    },
  })
}

export function useDeletePhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePhase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] })
    },
  })
}

// Iteration mutations
export function useCreateIteration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateIterationInput) => createIteration(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases', data.phase_id] })
    },
  })
}

export function useUpdateIteration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Pick<PrototypeIteration, 'feedback' | 'client_approved'>>
    }) => updateIteration(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] })
    },
  })
}

// Bug report mutations
export function useCreateBugReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBugReportInput) => createBugReport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] })
    },
  })
}

export function useUpdateBugReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Pick<BugReport, 'status' | 'resolved_by' | 'resolution_notes'>>
    }) => updateBugReport(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] })
    },
  })
}

// Deployment mutations
export function useCreateDeployment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDeploymentInput) => createDeployment(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases', data.phase_id] })
    },
  })
}
