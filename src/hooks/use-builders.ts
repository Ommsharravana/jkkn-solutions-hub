'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBuilders,
  getBuilderById,
  createBuilder,
  updateBuilder,
  deleteBuilder,
  addBuilderSkill,
  updateBuilderSkill,
  removeBuilderSkill,
  requestAssignment,
  approveAssignment,
  startAssignment,
  completeAssignment,
  withdrawAssignment,
  getPendingAssignmentRequests,
  getAssignmentsByStatus,
  getBuilderStats,
  getAvailableBuildersForPhase,
  checkAssignmentApproval,
  type BuilderFilters,
  type CreateBuilderInput,
  type UpdateBuilderInput,
  type AddSkillInput,
  type CreateAssignmentInput,
} from '@/services/builders'
import type { BuilderSkill, AssignmentStatus } from '@/types/database'

export function useBuilders(filters?: BuilderFilters) {
  return useQuery({
    queryKey: ['builders', filters],
    queryFn: () => getBuilders(filters),
  })
}

export function useBuilder(id: string) {
  return useQuery({
    queryKey: ['builders', id],
    queryFn: () => getBuilderById(id),
    enabled: !!id,
  })
}

export function useBuilderStats() {
  return useQuery({
    queryKey: ['builders', 'stats'],
    queryFn: getBuilderStats,
  })
}

export function usePendingAssignmentRequests() {
  return useQuery({
    queryKey: ['assignments', 'pending'],
    queryFn: getPendingAssignmentRequests,
  })
}

export function useAssignmentsByStatus(status: AssignmentStatus) {
  return useQuery({
    queryKey: ['assignments', 'status', status],
    queryFn: () => getAssignmentsByStatus(status),
  })
}

export function useAvailableBuildersForPhase(phaseId: string) {
  return useQuery({
    queryKey: ['builders', 'available', phaseId],
    queryFn: () => getAvailableBuildersForPhase(phaseId),
    enabled: !!phaseId,
  })
}

export function useCheckAssignmentApproval(phaseId: string) {
  return useQuery({
    queryKey: ['assignments', 'approval-check', phaseId],
    queryFn: () => checkAssignmentApproval(phaseId),
    enabled: !!phaseId,
  })
}

export function useCreateBuilder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBuilderInput) => createBuilder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

export function useUpdateBuilder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBuilderInput }) =>
      updateBuilder(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['builders'] })
      queryClient.setQueryData(['builders', data.id], data)
    },
  })
}

export function useDeleteBuilder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBuilder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

// Skill mutations
export function useAddBuilderSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddSkillInput) => addBuilderSkill(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['builders', data.builder_id] })
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

export function useUpdateBuilderSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Pick<BuilderSkill, 'proficiency_level'>>
    }) => updateBuilderSkill(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

export function useRemoveBuilderSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeBuilderSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

// Assignment mutations
export function useRequestAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => requestAssignment(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['phases', data.phase_id] })
      queryClient.invalidateQueries({ queryKey: ['builders', data.builder_id] })
    },
  })
}

export function useApproveAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
      approveAssignment(id, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

export function useStartAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => startAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

export function useCompleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => completeAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}

export function useWithdrawAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => withdrawAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      queryClient.invalidateQueries({ queryKey: ['builders'] })
    },
  })
}
