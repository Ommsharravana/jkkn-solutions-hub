'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTrainingPrograms,
  getTrainingProgramById,
  getTrainingProgramBySolutionId,
  createTrainingProgram,
  updateTrainingProgram,
  deleteTrainingProgram,
  type TrainingProgramFilters,
  type CreateTrainingProgramInput,
  type UpdateTrainingProgramInput,
} from '@/services/training-programs'
import {
  getTrainingSessions,
  getTrainingSessionById,
  getSessionsByProgramId,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  claimSession,
  assignSession,
  removeAssignment,
  completeSession,
  canSelfClaimSession,
  type TrainingSessionFilters,
  type CreateTrainingSessionInput,
  type UpdateTrainingSessionInput,
} from '@/services/training-sessions'
import {
  getCohortMembers,
  getCohortMemberById,
  getCohortMemberByUserId,
  createCohortMember,
  updateCohortMember,
  deleteCohortMember,
  levelUpCohortMember,
  getCohortMemberStats,
  getAvailableSessionsForMember,
  type CohortMemberFilters,
  type CreateCohortMemberInput,
  type UpdateCohortMemberInput,
} from '@/services/cohort-members'

// ============================================
// TRAINING PROGRAMS HOOKS
// ============================================

export function useTrainingPrograms(filters?: TrainingProgramFilters) {
  return useQuery({
    queryKey: ['training-programs', filters],
    queryFn: () => getTrainingPrograms(filters),
  })
}

export function useTrainingProgram(id: string) {
  return useQuery({
    queryKey: ['training-programs', id],
    queryFn: () => getTrainingProgramById(id),
    enabled: !!id,
  })
}

export function useTrainingProgramBySolution(solutionId: string) {
  return useQuery({
    queryKey: ['training-programs', 'by-solution', solutionId],
    queryFn: () => getTrainingProgramBySolutionId(solutionId),
    enabled: !!solutionId,
  })
}

export function useCreateTrainingProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTrainingProgramInput) => createTrainingProgram(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] })
    },
  })
}

export function useUpdateTrainingProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTrainingProgramInput }) =>
      updateTrainingProgram(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] })
      queryClient.setQueryData(['training-programs', data.id], data)
    },
  })
}

export function useDeleteTrainingProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTrainingProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] })
    },
  })
}

// ============================================
// TRAINING SESSIONS HOOKS
// ============================================

export function useTrainingSessions(filters?: TrainingSessionFilters) {
  return useQuery({
    queryKey: ['training-sessions', filters],
    queryFn: () => getTrainingSessions(filters),
  })
}

export function useTrainingSession(id: string) {
  return useQuery({
    queryKey: ['training-sessions', id],
    queryFn: () => getTrainingSessionById(id),
    enabled: !!id,
  })
}

export function useSessionsByProgram(programId: string) {
  return useQuery({
    queryKey: ['training-sessions', 'by-program', programId],
    queryFn: () => getSessionsByProgramId(programId),
    enabled: !!programId,
  })
}

export function useCanSelfClaimSession(sessionId: string) {
  return useQuery({
    queryKey: ['training-sessions', sessionId, 'can-self-claim'],
    queryFn: () => canSelfClaimSession(sessionId),
    enabled: !!sessionId,
  })
}

export function useCreateTrainingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTrainingSessionInput) => createTrainingSession(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      queryClient.invalidateQueries({
        queryKey: ['training-sessions', 'by-program', data.program_id],
      })
    },
  })
}

export function useUpdateTrainingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTrainingSessionInput }) =>
      updateTrainingSession(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      queryClient.setQueryData(['training-sessions', data.id], data)
    },
  })
}

export function useDeleteTrainingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTrainingSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
    },
  })
}

export function useClaimSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      cohortMemberId,
      role,
    }: {
      sessionId: string
      cohortMemberId: string
      role?: 'observer' | 'co_lead' | 'lead' | 'support'
    }) => claimSession(sessionId, cohortMemberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
    },
  })
}

export function useAssignSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      cohortMemberId,
      assignedById,
      role,
    }: {
      sessionId: string
      cohortMemberId: string
      assignedById: string
      role?: 'observer' | 'co_lead' | 'lead' | 'support'
    }) => assignSession(sessionId, cohortMemberId, assignedById, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
    },
  })
}

export function useRemoveAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      cohortMemberId,
    }: {
      sessionId: string
      cohortMemberId: string
    }) => removeAssignment(sessionId, cohortMemberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
    },
  })
}

export function useCompleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      attendanceCount,
      notes,
    }: {
      sessionId: string
      attendanceCount?: number
      notes?: string
    }) => completeSession(sessionId, attendanceCount, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
    },
  })
}

// ============================================
// COHORT MEMBERS HOOKS
// ============================================

export function useCohortMembers(filters?: CohortMemberFilters) {
  return useQuery({
    queryKey: ['cohort-members', filters],
    queryFn: () => getCohortMembers(filters),
  })
}

export function useCohortMember(id: string) {
  return useQuery({
    queryKey: ['cohort-members', id],
    queryFn: () => getCohortMemberById(id),
    enabled: !!id,
  })
}

export function useCohortMemberByUser(userId: string) {
  return useQuery({
    queryKey: ['cohort-members', 'by-user', userId],
    queryFn: () => getCohortMemberByUserId(userId),
    enabled: !!userId,
  })
}

export function useCohortMemberStats() {
  return useQuery({
    queryKey: ['cohort-members', 'stats'],
    queryFn: getCohortMemberStats,
  })
}

export function useAvailableSessionsForMember(memberId: string) {
  return useQuery({
    queryKey: ['cohort-members', memberId, 'available-sessions'],
    queryFn: () => getAvailableSessionsForMember(memberId),
    enabled: !!memberId,
  })
}

export function useCreateCohortMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCohortMemberInput) => createCohortMember(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
    },
  })
}

export function useUpdateCohortMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCohortMemberInput }) =>
      updateCohortMember(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
      queryClient.setQueryData(['cohort-members', data.id], data)
    },
  })
}

export function useDeleteCohortMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCohortMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
    },
  })
}

export function useLevelUpCohortMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => levelUpCohortMember(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
      queryClient.setQueryData(['cohort-members', data.id], data)
    },
  })
}
