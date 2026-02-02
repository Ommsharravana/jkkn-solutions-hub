'use client'

import { showToast, toastMessages } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ToastTestPage() {
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Toast Notification Test</CardTitle>
          <CardDescription>
            Test all toast notification types and pre-defined messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Basic Toast Types</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => showToast.success('Success!', 'This is a success message')}>
                Success Toast
              </Button>
              <Button onClick={() => showToast.error('Error!', 'This is an error message')} variant="destructive">
                Error Toast
              </Button>
              <Button onClick={() => showToast.warning('Warning!', 'This is a warning message')} variant="outline">
                Warning Toast
              </Button>
              <Button onClick={() => showToast.info('Info!', 'This is an info message')} variant="secondary">
                Info Toast
              </Button>
              <Button onClick={() => showToast.loading('Loading...')} variant="outline">
                Loading Toast
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pre-defined Messages - CRUD</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastMessages.created('Solution')}>Created</Button>
              <Button onClick={() => toastMessages.updated('Client')}>Updated</Button>
              <Button onClick={() => toastMessages.deleted('Department')}>Deleted</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pre-defined Messages - Auth</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastMessages.loginSuccess()}>Login Success</Button>
              <Button onClick={() => toastMessages.logoutSuccess()}>Logout Success</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pre-defined Messages - Assignments</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastMessages.assignmentRequested()}>Requested</Button>
              <Button onClick={() => toastMessages.assignmentApproved()}>Approved</Button>
              <Button onClick={() => toastMessages.assignmentRejected()}>Rejected</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pre-defined Messages - Payments</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastMessages.paymentRecorded('50,000')}>Payment Recorded</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pre-defined Messages - Errors</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastMessages.genericError()} variant="destructive">Generic Error</Button>
              <Button onClick={() => toastMessages.networkError()} variant="destructive">Network Error</Button>
              <Button onClick={() => toastMessages.permissionDenied()} variant="destructive">Permission Denied</Button>
              <Button onClick={() => toastMessages.validationError('Email is required')} variant="destructive">
                Validation Error
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pre-defined Messages - Settings</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastMessages.settingsSaved()}>Settings Saved</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Promise Toast</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  const promise = new Promise((resolve) => {
                    setTimeout(() => resolve('Data loaded'), 2000)
                  })
                  showToast.promise(promise, {
                    loading: 'Loading data...',
                    success: 'Data loaded successfully!',
                    error: 'Failed to load data',
                  })
                }}
              >
                Promise Toast (Success)
              </Button>
              <Button
                onClick={() => {
                  const promise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Network timeout')), 2000)
                  })
                  showToast.promise(promise, {
                    loading: 'Saving changes...',
                    success: 'Changes saved!',
                    error: (error) => `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  })
                }}
                variant="destructive"
              >
                Promise Toast (Error)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
