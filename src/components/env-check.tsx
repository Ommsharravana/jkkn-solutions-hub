'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface EnvCheckProps {
  required: string[]
}

export function EnvCheck({ required }: EnvCheckProps) {
  const [missing, setMissing] = useState<string[]>([])

  useEffect(() => {
    // Check client-side env vars (only NEXT_PUBLIC_ vars are available)
    const missingVars = required.filter((key) => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        return !process.env[key]
      }
      return false // Can't check server-side vars on client
    })
    setMissing(missingVars)
  }, [required])

  if (missing.length === 0) return null

  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Configuration Error</AlertTitle>
      <AlertDescription>
        Missing required environment variables:
        <ul className="list-disc list-inside mt-2">
          {missing.map((key) => (
            <li key={key} className="font-mono text-sm">{key}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
