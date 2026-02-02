'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="max-w-lg w-full p-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Application Error</h1>
            <p className="text-muted-foreground">
              A critical error occurred. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32 text-left">
                {error.message}
              </pre>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
