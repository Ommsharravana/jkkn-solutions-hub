import { toast } from 'sonner'

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description })
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description })
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description })
  },

  loading: (message: string) => {
    return toast.loading(message)
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId)
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  },
}

// Pre-defined toast messages for common actions
export const toastMessages = {
  // CRUD operations
  created: (entity: string) => showToast.success(`${entity} created successfully`),
  updated: (entity: string) => showToast.success(`${entity} updated successfully`),
  deleted: (entity: string) => showToast.success(`${entity} deleted successfully`),

  // Auth
  loginSuccess: () => showToast.success('Welcome back!', 'You have been logged in successfully.'),
  logoutSuccess: () => showToast.info('Logged out', 'You have been logged out successfully.'),

  // Assignments
  assignmentRequested: () => showToast.success('Assignment requested', 'Your request has been submitted for approval.'),
  assignmentApproved: () => showToast.success('Assignment approved', 'The assignment has been approved.'),
  assignmentRejected: () => showToast.warning('Assignment rejected', 'The assignment request was rejected.'),

  // Payments
  paymentRecorded: (amount: string) => showToast.success('Payment recorded', `₹${amount} has been recorded successfully.`),

  // Errors
  genericError: () => showToast.error('Something went wrong', 'Please try again later.'),
  networkError: () => showToast.error('Network error', 'Please check your internet connection.'),
  permissionDenied: () => showToast.error('Permission denied', 'You do not have access to this action.'),
  validationError: (message: string) => showToast.error('Validation error', message),

  // Settings
  settingsSaved: () => showToast.success('Settings saved', 'Your preferences have been updated.'),
}
