'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getDepartmentClients,
  getDepartmentRevenue,
  getDepartmentPhases,
  getDepartmentCohortMembers,
  getDepartmentRank,
  getDepartmentStats,
  getDepartmentSolutions,
  getDepartmentBuilders,
} from '@/services/department-dashboard'

/**
 * Hook to fetch clients sourced by a department
 */
export function useDepartmentClients(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'clients', deptId],
    queryFn: () => getDepartmentClients(deptId!),
    enabled: !!deptId,
  })
}

/**
 * Hook to fetch department revenue share
 */
export function useDepartmentRevenue(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'revenue', deptId],
    queryFn: () => getDepartmentRevenue(deptId!),
    enabled: !!deptId,
  })
}

/**
 * Hook to fetch active phases owned by department
 */
export function useDepartmentPhases(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'phases', deptId],
    queryFn: () => getDepartmentPhases(deptId!),
    enabled: !!deptId,
  })
}

/**
 * Hook to fetch cohort members from department
 */
export function useDepartmentCohortMembers(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'cohort-members', deptId],
    queryFn: () => getDepartmentCohortMembers(deptId!),
    enabled: !!deptId,
  })
}

/**
 * Hook to fetch department ranking
 */
export function useDepartmentRank(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'rank', deptId],
    queryFn: () => getDepartmentRank(deptId!),
    enabled: !!deptId,
  })
}

/**
 * Hook to fetch comprehensive department stats
 */
export function useDepartmentStats(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'stats', deptId],
    queryFn: () => getDepartmentStats(deptId!),
    enabled: !!deptId,
  })
}

/**
 * Hook to fetch solutions led by department
 */
export function useDepartmentSolutions(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'solutions', deptId],
    queryFn: () => getDepartmentSolutions(deptId!),
    enabled: !!deptId,
  })
}

/**
 * Hook to fetch builders from department
 */
export function useDepartmentBuilders(deptId: string | null | undefined) {
  return useQuery({
    queryKey: ['department-dashboard', 'builders', deptId],
    queryFn: () => getDepartmentBuilders(deptId!),
    enabled: !!deptId,
  })
}
