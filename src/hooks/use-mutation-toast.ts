import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { showToast } from '@/lib/toast'

interface MutationToastOptions {
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
}

export function useMutationWithToast<TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> & MutationToastOptions
) {
  const {
    loadingMessage = 'Processing...',
    successMessage = 'Success!',
    errorMessage = 'Something went wrong',
    onSuccess,
    onError,
    ...restOptions
  } = options || {}

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const toastId = showToast.loading(loadingMessage)

      try {
        const result = await mutationFn(variables)
        showToast.dismiss(toastId)
        showToast.success(successMessage)
        return result
      } catch (error) {
        showToast.dismiss(toastId)
        showToast.error(errorMessage, error instanceof Error ? error.message : undefined)
        throw error
      }
    },
    onSuccess,
    onError,
    ...restOptions,
  })
}
