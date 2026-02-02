'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBuilderByUserId,
  getMyAssignments,
  getAvailablePhases,
  claimPhase,
  startPhaseWork,
  completePhaseWork,
  withdrawFromPhase,
  getMySkills,
  addMySkill,
  updateMySkillProficiency,
  removeMySkill,
  getMyEarnings,
  getPortalOverview,
} from '@/services/builder-portal'
import type { AssignmentStatus, BuilderRole } from '@/types/database'

// Get builder profile by user ID
export function useBuilderProfile(userId: string) {
  return useQuery({
    queryKey: ['builder-portal', 'profile', userId],
    queryFn: () => getBuilderByUserId(userId),
    enabled: !!userId,
  })
}

// Get portal overview
export function usePortalOverview(builderId: string) {
  return useQuery({
    queryKey: ['builder-portal', 'overview', builderId],
    queryFn: () => getPortalOverview(builderId),
    enabled: !!builderId,
  })
}

// Get my assignments
export function useMyAssignments(builderId: string, statusFilter?: AssignmentStatus) {
  return useQuery({
    queryKey: ['builder-portal', 'assignments', builderId, statusFilter],
    queryFn: () => getMyAssignments(builderId, statusFilter),
    enabled: !!builderId,
  })
}

// Get available phases to claim
export function useAvailablePhases(builderId: string) {
  return useQuery({
    queryKey: ['builder-portal', 'available-phases', builderId],
    queryFn: () => getAvailablePhases(builderId),
    enabled: !!builderId,
  })
}

// Claim a phase
export function useClaimPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      phaseId,
      builderId,
      role,
    }: {
      phaseId: string
      builderId: string
      role?: BuilderRole
    }) => claimPhase(phaseId, builderId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'assignments', variables.builderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'available-phases', variables.builderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'overview', variables.builderId],
      })
    },
  })
}

// Start phase work
export function useStartPhaseWork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      builderId,
    }: {
      assignmentId: string
      builderId: string
    }) => startPhaseWork(assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'assignments', variables.builderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'overview', variables.builderId],
      })
    },
  })
}

// Complete phase work
export function useCompletePhaseWork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      builderId,
    }: {
      assignmentId: string
      builderId: string
    }) => completePhaseWork(assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'assignments', variables.builderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'overview', variables.builderId],
      })
    },
  })
}

// Withdraw from phase
export function useWithdrawFromPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      builderId,
    }: {
      assignmentId: string
      builderId: string
    }) => withdrawFromPhase(assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'assignments', variables.builderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'available-phases', variables.builderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'overview', variables.builderId],
      })
    },
  })
}

// Get my skills
export function useMySkills(builderId: string) {
  return useQuery({
    queryKey: ['builder-portal', 'skills', builderId],
    queryFn: () => getMySkills(builderId),
    enabled: !!builderId,
  })
}

// Add skill
export function useAddMySkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      builderId,
      skillName,
      proficiencyLevel,
    }: {
      builderId: string
      skillName: string
      proficiencyLevel?: number
    }) => addMySkill(builderId, skillName, proficiencyLevel),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'skills', variables.builderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'profile'],
      })
    },
  })
}

// Update skill proficiency
export function useUpdateMySkillProficiency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      skillId,
      proficiencyLevel,
      builderId,
    }: {
      skillId: string
      proficiencyLevel: number
      builderId: string
    }) => updateMySkillProficiency(skillId, proficiencyLevel),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'skills', variables.builderId],
      })
    },
  })
}

// Remove skill
export function useRemoveMySkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ skillId, builderId }: { skillId: string; builderId: string }) =>
      removeMySkill(skillId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['builder-portal', 'skills', variables.builderId],
      })
    },
  })
}

// Get my earnings
export function useMyEarnings(builderId: string) {
  return useQuery({
    queryKey: ['builder-portal', 'earnings', builderId],
    queryFn: () => getMyEarnings(builderId),
    enabled: !!builderId,
  })
}
