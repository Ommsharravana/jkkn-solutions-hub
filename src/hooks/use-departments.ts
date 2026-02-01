'use client'

import { useQuery } from '@tanstack/react-query'
import { getDepartments, getDepartmentById } from '@/services/departments'

/**
 * Hook to fetch all active departments
 */
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })
}

/**
 * Hook to fetch a single department by ID
 */
export function useDepartment(id: string) {
  return useQuery({
    queryKey: ['departments', id],
    queryFn: () => getDepartmentById(id),
    enabled: !!id,
  })
}
