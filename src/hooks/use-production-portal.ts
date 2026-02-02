'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyStats,
  getAvailableWork,
  claimDeliverable,
  getMyWork,
  getMyActiveWork,
  submitWork,
  getMyEarnings,
  getDeliverableForSubmission,
  getLearnerByUserId,
  getAllAvailableWork,
} from '@/services/production-portal'
import type { ContentDivision } from '@/types/database'

// Get current learner by user ID
export function useLearnerByUserId(userId: string | undefined) {
  return useQuery({
    queryKey: ['production-portal', 'learner', userId],
    queryFn: () => getLearnerByUserId(userId!),
    enabled: !!userId,
  })
}

// Get portal stats for learner
export function useMyStats(learnerId: string | undefined) {
  return useQuery({
    queryKey: ['production-portal', 'stats', learnerId],
    queryFn: () => getMyStats(learnerId!),
    enabled: !!learnerId,
  })
}

// Get available work for a division
export function useAvailableWork(
  learnerId: string | undefined,
  division?: ContentDivision
) {
  return useQuery({
    queryKey: ['production-portal', 'available-work', learnerId, division],
    queryFn: () => getAvailableWork(learnerId!, division),
    enabled: !!learnerId,
  })
}

// Get all available work across divisions
export function useAllAvailableWork() {
  return useQuery({
    queryKey: ['production-portal', 'all-available-work'],
    queryFn: getAllAvailableWork,
  })
}

// Get my work (all assignments)
export function useMyWork(learnerId: string | undefined) {
  return useQuery({
    queryKey: ['production-portal', 'my-work', learnerId],
    queryFn: () => getMyWork(learnerId!),
    enabled: !!learnerId,
  })
}

// Get my active work (not completed)
export function useMyActiveWork(learnerId: string | undefined) {
  return useQuery({
    queryKey: ['production-portal', 'my-active-work', learnerId],
    queryFn: () => getMyActiveWork(learnerId!),
    enabled: !!learnerId,
  })
}

// Get my earnings
export function useMyEarnings(learnerId: string | undefined) {
  return useQuery({
    queryKey: ['production-portal', 'earnings', learnerId],
    queryFn: () => getMyEarnings(learnerId!),
    enabled: !!learnerId,
  })
}

// Get deliverable for submission
export function useDeliverableForSubmission(
  deliverableId: string,
  learnerId: string | undefined
) {
  return useQuery({
    queryKey: ['production-portal', 'submission', deliverableId, learnerId],
    queryFn: () => getDeliverableForSubmission(deliverableId, learnerId!),
    enabled: !!deliverableId && !!learnerId,
  })
}

// Claim a deliverable
export function useClaimWork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      deliverableId,
      learnerId,
    }: {
      deliverableId: string
      learnerId: string
    }) => claimDeliverable(deliverableId, learnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-portal'] })
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
  })
}

// Submit work
export function useSubmitWork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      deliverableId,
      fileUrl,
      fileType,
    }: {
      deliverableId: string
      fileUrl: string
      fileType?: string
    }) => submitWork(deliverableId, fileUrl, fileType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-portal'] })
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
  })
}
