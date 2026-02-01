'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SolutionForm } from '@/components/solutions'
import { ArrowLeft } from 'lucide-react'

export default function NewSolutionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/solutions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Solution</h1>
          <p className="text-muted-foreground">
            Set up a new software, training, or content solution
          </p>
        </div>
      </div>

      <SolutionForm />
    </div>
  )
}
