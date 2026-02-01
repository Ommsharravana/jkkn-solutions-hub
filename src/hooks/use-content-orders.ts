'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getContentOrders,
  getContentOrderById,
  getContentOrderBySolutionId,
  createContentOrder,
  updateContentOrder,
  deleteContentOrder,
  getOrdersByDivision,
  getContentOrderStats,
  type ContentOrderFilters,
  type CreateContentOrderInput,
  type UpdateContentOrderInput,
} from '@/services/content-orders'
import type { ContentDivision } from '@/types/database'

export function useContentOrders(filters?: ContentOrderFilters) {
  return useQuery({
    queryKey: ['content-orders', filters],
    queryFn: () => getContentOrders(filters),
  })
}

export function useContentOrder(id: string) {
  return useQuery({
    queryKey: ['content-orders', id],
    queryFn: () => getContentOrderById(id),
    enabled: !!id,
  })
}

export function useContentOrderBySolution(solutionId: string) {
  return useQuery({
    queryKey: ['content-orders', 'solution', solutionId],
    queryFn: () => getContentOrderBySolutionId(solutionId),
    enabled: !!solutionId,
  })
}

export function useOrdersByDivision(division: ContentDivision) {
  return useQuery({
    queryKey: ['content-orders', 'division', division],
    queryFn: () => getOrdersByDivision(division),
    enabled: !!division,
  })
}

export function useContentOrderStats() {
  return useQuery({
    queryKey: ['content-orders', 'stats'],
    queryFn: getContentOrderStats,
  })
}

export function useCreateContentOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContentOrderInput) => createContentOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-orders'] })
    },
  })
}

export function useUpdateContentOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContentOrderInput }) =>
      updateContentOrder(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-orders'] })
      queryClient.setQueryData(['content-orders', data.id], data)
    },
  })
}

export function useDeleteContentOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContentOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-orders'] })
    },
  })
}
