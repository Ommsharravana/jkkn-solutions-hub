'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyProfile,
  getMemberById,
  getAvailableSessions,
  claimSessionAsMember,
  withdrawFromSession,
  getMySchedule,
  getUpcomingSessions,
  getCompletedSessions,
  getMyEarnings,
  getLevelProgress,
  requestLevelUp,
  getDashboardStats,
  type CohortMemberProfile,
} from '@/services/cohort-portal'
import type { CohortRole } from '@/types/database'

// ============================================
// PROFILE HOOKS
// ============================================

export function useCohortProfile(userId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'profile', userId],
    queryFn: () => getMyProfile(userId),
    enabled: !!userId,
  })
}

export function useCohortMemberById(memberId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'member', memberId],
    queryFn: () => getMemberById(memberId),
    enabled: !!memberId,
  })
}

// ============================================
// AVAILABLE SESSIONS HOOKS
// ============================================

export function useAvailableSessions(memberId: string, level: number) {
  return useQuery({
    queryKey: ['cohort-portal', 'available-sessions', memberId, level],
    queryFn: () => getAvailableSessions(memberId, level),
    enabled: !!memberId,
  })
}

// ============================================
// SESSION CLAIMING HOOKS
// ============================================

export function useClaimSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      memberId,
      role,
    }: {
      sessionId: string
      memberId: string
      role: CohortRole
    }) => claimSessionAsMember(sessionId, memberId, role),
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'available-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'schedule'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'upcoming'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
    },
  })
}

export function useWithdrawFromSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      memberId,
    }: {
      sessionId: string
      memberId: string
    }) => withdrawFromSession(sessionId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'available-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'schedule'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'upcoming'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-portal', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
    },
  })
}

// ============================================
// SCHEDULE HOOKS
// ============================================

export function useMySchedule(memberId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'schedule', memberId],
    queryFn: () => getMySchedule(memberId),
    enabled: !!memberId,
  })
}

export function useUpcomingSessions(memberId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'upcoming', memberId],
    queryFn: () => getUpcomingSessions(memberId),
    enabled: !!memberId,
  })
}

export function useCompletedSessions(memberId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'completed', memberId],
    queryFn: () => getCompletedSessions(memberId),
    enabled: !!memberId,
  })
}

// ============================================
// EARNINGS HOOKS
// ============================================

export function useMyEarnings(memberId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'earnings', memberId],
    queryFn: () => getMyEarnings(memberId),
    enabled: !!memberId,
  })
}

// ============================================
// LEVEL PROGRESS HOOKS
// ============================================

export function useLevelProgress(memberId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'level-progress', memberId],
    queryFn: () => getLevelProgress(memberId),
    enabled: !!memberId,
  })
}

export function useRequestLevelUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => requestLevelUp(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-portal'] })
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] })
    },
  })
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useDashboardStats(memberId: string) {
  return useQuery({
    queryKey: ['cohort-portal', 'dashboard', memberId],
    queryFn: () => getDashboardStats(memberId),
    enabled: !!memberId,
  })
}
