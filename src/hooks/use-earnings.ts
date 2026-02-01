'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEarnings,
  getEarningsByRecipient,
  getEarningsSummary,
  getRecipientTotalEarnings,
  updateEarningsStatus,
  bulkUpdateEarningsStatus,
  approvePaymentEarnings,
  markEarningsAsPaid,
  getDepartmentEarnings,
  getMonthlyEarningsReport,
  type EarningsFilters,
} from '@/services/earnings'
import type { EarningsStatus, RecipientType } from '@/types/database'

export function useEarnings(filters?: EarningsFilters) {
  return useQuery({
    queryKey: ['earnings', filters],
    queryFn: () => getEarnings(filters),
  })
}

export function useEarningsByRecipient(recipientType: RecipientType, recipientId: string) {
  return useQuery({
    queryKey: ['earnings', 'recipient', recipientType, recipientId],
    queryFn: () => getEarningsByRecipient(recipientType, recipientId),
    enabled: !!recipientType && !!recipientId,
  })
}

export function useEarningsSummary() {
  return useQuery({
    queryKey: ['earnings-summary'],
    queryFn: getEarningsSummary,
  })
}

export function useRecipientTotalEarnings(recipientType: RecipientType, recipientId: string) {
  return useQuery({
    queryKey: ['earnings', 'total', recipientType, recipientId],
    queryFn: () => getRecipientTotalEarnings(recipientType, recipientId),
    enabled: !!recipientType && !!recipientId,
  })
}

export function useDepartmentEarnings(
  departmentId: string,
  fromDate?: string,
  toDate?: string
) {
  return useQuery({
    queryKey: ['earnings', 'department', departmentId, fromDate, toDate],
    queryFn: () => getDepartmentEarnings(departmentId, fromDate, toDate),
    enabled: !!departmentId,
  })
}

export function useMonthlyEarningsReport(month: number, year: number) {
  return useQuery({
    queryKey: ['earnings', 'monthly', month, year],
    queryFn: () => getMonthlyEarningsReport(month, year),
    enabled: month > 0 && year > 0,
  })
}

export function useUpdateEarningsStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
      paidAt,
    }: {
      id: string
      status: EarningsStatus
      paidAt?: string
    }) => updateEarningsStatus(id, status, paidAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      queryClient.invalidateQueries({ queryKey: ['earnings-summary'] })
    },
  })
}

export function useBulkUpdateEarningsStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: EarningsStatus }) =>
      bulkUpdateEarningsStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      queryClient.invalidateQueries({ queryKey: ['earnings-summary'] })
    },
  })
}

export function useApprovePaymentEarnings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: string) => approvePaymentEarnings(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      queryClient.invalidateQueries({ queryKey: ['earnings-summary'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useMarkEarningsAsPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, paidAt }: { ids: string[]; paidAt?: string }) =>
      markEarningsAsPaid(ids, paidAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      queryClient.invalidateQueries({ queryKey: ['earnings-summary'] })
    },
  })
}
