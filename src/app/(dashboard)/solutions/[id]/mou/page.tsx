'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MouForm } from '@/components/solutions/mou-form'
import { useSolution } from '@/hooks/use-solutions'
import { useMouBySolution } from '@/hooks/use-mous'
import { ArrowLeft, FileText } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MouPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: solution, isLoading: solutionLoading } = useSolution(id)
  const { data: mou, isLoading: mouLoading } = useMouBySolution(id)

  const isLoading = solutionLoading || mouLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!solution) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/solutions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solution Not Found</h1>
            <p className="text-muted-foreground">
              The solution you are looking for does not exist or has been deleted.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/solutions/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">
              {mou ? 'MoU Details' : 'Create MoU'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {solution.title} ({solution.solution_code})
          </p>
        </div>
      </div>

      {/* MoU Form */}
      <MouForm
        solutionId={id}
        solutionTitle={solution.title}
        clientName={solution.client?.name}
        existingMou={mou}
      />
    </div>
  )
}
