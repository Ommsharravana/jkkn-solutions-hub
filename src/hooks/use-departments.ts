'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDepartments,
  getDepartmentById,
  getAllDepartments,
  getDepartmentsWithStats,
  deactivateDepartment,
  reactivateDepartment,
} from '@/services/departments'

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
 * Hook to fetch all departments (including inactive)
 */
export function useAllDepartments() {
  return useQuery({
    queryKey: ['departments', 'all'],
    queryFn: getAllDepartments,
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

/**
 * Hook to fetch all departments with statistics
 */
export function useDepartmentsWithStats() {
  return useQuery({
    queryKey: ['departments', 'with-stats'],
    queryFn: getDepartmentsWithStats,
  })
}

/**
 * Hook to deactivate a department
 */
export function useDeactivateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

/**
 * Hook to reactivate a department
 */
export function useReactivateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}
