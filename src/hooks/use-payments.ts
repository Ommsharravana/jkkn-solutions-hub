'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getMonthlyBatch,
  getPaymentStats,
  flagPayment,
  autoProcessPendingPayments,
  type PaymentFilters,
  type CreatePaymentInput,
  type UpdatePaymentInput,
} from '@/services/payments'

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => getPayments(filters),
  })
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPaymentById(id),
    enabled: !!id,
  })
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ['payment-stats'],
    queryFn: getPaymentStats,
  })
}

export function useMonthlyBatch(month: number, year: number) {
  return useQuery({
    queryKey: ['monthly-batch', month, year],
    queryFn: () => getMonthlyBatch(month, year),
    enabled: month > 0 && year > 0,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-batch'] })
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentInput }) =>
      updatePayment(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-batch'] })
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-batch'] })
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
  })
}

export function useFlagPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      flagPayment(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['monthly-batch'] })
    },
  })
}

export function useAutoProcessPayments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: autoProcessPendingPayments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-batch'] })
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
  })
}
