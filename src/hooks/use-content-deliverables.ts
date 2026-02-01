'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDeliverables,
  getDeliverableById,
  getDeliverablesByOrderId,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  requestRevision,
  approveDeliverable,
  rejectDeliverable,
  submitForReview,
  getDeliverableStats,
  type DeliverableFilters,
  type CreateDeliverableInput,
  type UpdateDeliverableInput,
} from '@/services/content-deliverables'

export function useDeliverables(filters?: DeliverableFilters) {
  return useQuery({
    queryKey: ['deliverables', filters],
    queryFn: () => getDeliverables(filters),
  })
}

export function useDeliverable(id: string) {
  return useQuery({
    queryKey: ['deliverables', id],
    queryFn: () => getDeliverableById(id),
    enabled: !!id,
  })
}

export function useDeliverablesByOrder(orderId: string) {
  return useQuery({
    queryKey: ['deliverables', 'order', orderId],
    queryFn: () => getDeliverablesByOrderId(orderId),
    enabled: !!orderId,
  })
}

export function useDeliverableStats(orderId?: string) {
  return useQuery({
    queryKey: ['deliverables', 'stats', orderId],
    queryFn: () => getDeliverableStats(orderId),
  })
}

export function useCreateDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDeliverableInput) => createDeliverable(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
  })
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeliverableInput }) =>
      updateDeliverable(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      queryClient.setQueryData(['deliverables', data.id], data)
    },
  })
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDeliverable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
  })
}

export function useRequestRevision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      requestRevision(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      queryClient.setQueryData(['deliverables', data.id], data)
    },
  })
}

export function useApproveDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      approveDeliverable(id, approvedBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      queryClient.setQueryData(['deliverables', data.id], data)
    },
  })
}

export function useRejectDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      rejectDeliverable(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      queryClient.setQueryData(['deliverables', data.id], data)
    },
  })
}

export function useSubmitForReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      fileUrl,
      fileType,
    }: {
      id: string
      fileUrl: string
      fileType?: string
    }) => submitForReview(id, fileUrl, fileType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      queryClient.setQueryData(['deliverables', data.id], data)
    },
  })
}
