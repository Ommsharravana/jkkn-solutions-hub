'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
} from '@/services/institutions'
import type { Institution } from '@/types'

export function useInstitutions() {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: getInstitutions,
  })
}

export function useInstitution(id: string) {
  return useQuery({
    queryKey: ['institutions', id],
    queryFn: () => getInstitutionById(id),
    enabled: !!id,
  })
}

export function useCreateInstitution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (institution: Omit<Institution, 'id' | 'created_at' | 'updated_at'>) =>
      createInstitution(institution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
    },
  })
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Institution> }) =>
      updateInstitution(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      queryClient.setQueryData(['institutions', data.id], data)
    },
  })
}
