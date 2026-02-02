'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMouBySolutionId,
  getMouById,
  getAllMous,
  getExpiringMous,
  createMou,
  updateMou,
  sendMou,
  markMouSigned,
  activateMou,
  deleteMou,
  getMouStats,
  type CreateMouInput,
  type UpdateMouInput,
} from '@/services/mous'

export function useMouBySolution(solutionId: string) {
  return useQuery({
    queryKey: ['mous', 'solution', solutionId],
    queryFn: () => getMouBySolutionId(solutionId),
    enabled: !!solutionId,
  })
}

export function useMou(id: string) {
  return useQuery({
    queryKey: ['mous', id],
    queryFn: () => getMouById(id),
    enabled: !!id,
  })
}

export function useMous() {
  return useQuery({
    queryKey: ['mous'],
    queryFn: getAllMous,
  })
}

export function useExpiringMous(daysThreshold: number = 30) {
  return useQuery({
    queryKey: ['mous', 'expiring', daysThreshold],
    queryFn: () => getExpiringMous(daysThreshold),
  })
}

export function useMouStats() {
  return useQuery({
    queryKey: ['mous', 'stats'],
    queryFn: getMouStats,
  })
}

export function useCreateMou() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMouInput) => createMou(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mous'] })
      queryClient.setQueryData(['mous', 'solution', data.solution_id], data)
    },
  })
}

export function useUpdateMou() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMouInput }) =>
      updateMou(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mous'] })
      queryClient.setQueryData(['mous', data.id], data)
      queryClient.setQueryData(['mous', 'solution', data.solution_id], data)
    },
  })
}

export function useSendMou() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sendMou(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mous'] })
      queryClient.setQueryData(['mous', data.id], data)
      queryClient.setQueryData(['mous', 'solution', data.solution_id], data)
    },
  })
}

export function useMarkMouSigned() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, signedDate }: { id: string; signedDate?: string }) =>
      markMouSigned(id, signedDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mous'] })
      queryClient.setQueryData(['mous', data.id], data)
      queryClient.setQueryData(['mous', 'solution', data.solution_id], data)
    },
  })
}

export function useActivateMou() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, startDate }: { id: string; startDate?: string }) =>
      activateMou(id, startDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mous'] })
      queryClient.setQueryData(['mous', data.id], data)
      queryClient.setQueryData(['mous', 'solution', data.solution_id], data)
    },
  })
}

export function useDeleteMou() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteMou(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mous'] })
    },
  })
}
