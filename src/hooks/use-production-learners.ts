'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProductionLearners,
  getProductionLearnerById,
  getProductionLearnersByDivision,
  createProductionLearner,
  updateProductionLearner,
  deleteProductionLearner,
  createProductionAssignment,
  claimDeliverable,
  completeAssignment,
  getAssignmentsByLearnerId,
  getAssignmentsByDeliverableId,
  getProductionLearnerStats,
  getAvailableDeliverablesForDivision,
  type ProductionLearnerFilters,
  type CreateProductionLearnerInput,
  type UpdateProductionLearnerInput,
  type CreateProductionAssignmentInput,
} from '@/services/production-learners'
import type { ContentDivision } from '@/types/database'

export function useProductionLearners(filters?: ProductionLearnerFilters) {
  return useQuery({
    queryKey: ['production-learners', filters],
    queryFn: () => getProductionLearners(filters),
  })
}

export function useProductionLearner(id: string) {
  return useQuery({
    queryKey: ['production-learners', id],
    queryFn: () => getProductionLearnerById(id),
    enabled: !!id,
  })
}

export function useProductionLearnersByDivision(division: ContentDivision) {
  return useQuery({
    queryKey: ['production-learners', 'division', division],
    queryFn: () => getProductionLearnersByDivision(division),
    enabled: !!division,
  })
}

export function useProductionLearnerStats() {
  return useQuery({
    queryKey: ['production-learners', 'stats'],
    queryFn: getProductionLearnerStats,
  })
}

export function useLearnerAssignments(learnerId: string) {
  return useQuery({
    queryKey: ['assignments', 'learner', learnerId],
    queryFn: () => getAssignmentsByLearnerId(learnerId),
    enabled: !!learnerId,
  })
}

export function useDeliverableAssignments(deliverableId: string) {
  return useQuery({
    queryKey: ['assignments', 'deliverable', deliverableId],
    queryFn: () => getAssignmentsByDeliverableId(deliverableId),
    enabled: !!deliverableId,
  })
}

export function useAvailableDeliverables(division: ContentDivision) {
  return useQuery({
    queryKey: ['deliverables', 'available', division],
    queryFn: () => getAvailableDeliverablesForDivision(division),
    enabled: !!division,
  })
}

export function useCreateProductionLearner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductionLearnerInput) =>
      createProductionLearner(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-learners'] })
    },
  })
}

export function useUpdateProductionLearner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateProductionLearnerInput
    }) => updateProductionLearner(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-learners'] })
      queryClient.setQueryData(['production-learners', data.id], data)
    },
  })
}

export function useDeleteProductionLearner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProductionLearner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-learners'] })
    },
  })
}

export function useCreateProductionAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductionAssignmentInput) => createProductionAssignment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
  })
}

export function useClaimDeliverable() {
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
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
  })
}

export function useCompleteProductionAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      earnings,
      qualityRating,
    }: {
      assignmentId: string
      earnings?: number
      qualityRating?: number
    }) => completeAssignment(assignmentId, earnings, qualityRating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['production-learners'] })
    },
  })
}
