'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPublications,
  getPublicationById,
  createPublication,
  updatePublication,
  deletePublication,
  getContributors,
  addContributor,
  removeContributor,
  getPublicationStats,
  type PublicationFilters,
  type CreatePublicationInput,
  type UpdatePublicationInput,
  type AddContributorInput,
} from '@/services/publications'

export function usePublications(filters?: PublicationFilters) {
  return useQuery({
    queryKey: ['publications', filters],
    queryFn: () => getPublications(filters),
  })
}

export function usePublication(id: string) {
  return useQuery({
    queryKey: ['publications', id],
    queryFn: () => getPublicationById(id),
    enabled: !!id,
  })
}

export function usePublicationStats() {
  return useQuery({
    queryKey: ['publications', 'stats'],
    queryFn: getPublicationStats,
  })
}

export function useCreatePublication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePublicationInput) => createPublication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      queryClient.invalidateQueries({ queryKey: ['accreditation'] })
    },
  })
}

export function useUpdatePublication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePublicationInput }) =>
      updatePublication(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      queryClient.invalidateQueries({ queryKey: ['accreditation'] })
      queryClient.setQueryData(['publications', data.id], data)
    },
  })
}

export function useDeletePublication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePublication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
      queryClient.invalidateQueries({ queryKey: ['accreditation'] })
    },
  })
}

// Contributors
export function useContributors(publicationId: string) {
  return useQuery({
    queryKey: ['publications', publicationId, 'contributors'],
    queryFn: () => getContributors(publicationId),
    enabled: !!publicationId,
  })
}

export function useAddContributor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddContributorInput) => addContributor(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['publications', variables.publication_id, 'contributors'],
      })
    },
  })
}

export function useRemoveContributor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeContributor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] })
    },
  })
}
