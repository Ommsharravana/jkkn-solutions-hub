'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getAccreditationMetrics,
  calculateNIRFMetrics,
  calculateNAACCriteria,
  generateNIRFReport,
  generateNAACReport,
} from '@/services/accreditation'
import type { MetricType } from '@/types/database'

export function useAccreditationMetrics(type?: MetricType) {
  return useQuery({
    queryKey: ['accreditation', 'metrics', type],
    queryFn: () => getAccreditationMetrics(type),
  })
}

export function useNIRFMetrics() {
  return useQuery({
    queryKey: ['accreditation', 'nirf'],
    queryFn: calculateNIRFMetrics,
  })
}

export function useNAACCriteria() {
  return useQuery({
    queryKey: ['accreditation', 'naac'],
    queryFn: calculateNAACCriteria,
  })
}

export function useNIRFReport() {
  return useQuery({
    queryKey: ['accreditation', 'nirf', 'report'],
    queryFn: generateNIRFReport,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useNAACReport() {
  return useQuery({
    queryKey: ['accreditation', 'naac', 'report'],
    queryFn: generateNAACReport,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}
