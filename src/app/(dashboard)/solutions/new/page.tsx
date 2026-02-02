'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SolutionForm } from '@/components/solutions'
import { DiscoveryModeSelector } from '@/components/discovery'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Sparkles, SkipForward } from 'lucide-react'
import type { DiscoveryData } from '@/components/discovery/types'

export default function NewSolutionPage() {
  const { user } = useAuth()
  const [discoveryData, setDiscoveryData] = useState<Partial<DiscoveryData> | null>(null)
  const [skipDiscovery, setSkipDiscovery] = useState(false)

  const handleDiscoveryComplete = (data: Partial<DiscoveryData>) => {
    setDiscoveryData(data)
  }

  // Show discovery first unless skipped
  const showDiscovery = !discoveryData && !skipDiscovery

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/solutions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {showDiscovery ? 'Start Discovery' : 'Create Solution'}
            </h1>
            <p className="text-muted-foreground">
              {showDiscovery
                ? 'Define the problem before building the solution'
                : 'Set up a new software, training, or content solution'}
            </p>
          </div>
        </div>
        {showDiscovery && (
          <Button variant="ghost" onClick={() => setSkipDiscovery(true)}>
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Discovery
          </Button>
        )}
      </div>

      {showDiscovery ? (
        <div className="max-w-4xl mx-auto">
          <DiscoveryModeSelector
            userRole={user?.role || 'client'}
            onComplete={handleDiscoveryComplete}
            initialData={discoveryData || undefined}
          />
        </div>
      ) : (
        <>
          {discoveryData && (
            <div className="max-w-3xl mx-auto mb-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Discovery Complete ({discoveryData.completionPercentage}%)</p>
                  <p className="text-sm text-muted-foreground">
                    {discoveryData.mode === 'quick' && 'Quick capture completed'}
                    {discoveryData.mode === 'guided' && `${discoveryData.completedSteps?.length || 0} steps completed`}
                    {discoveryData.mode === 'studio' && 'Studio data imported'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    setDiscoveryData(null)
                    setSkipDiscovery(false)
                  }}
                >
                  Edit Discovery
                </Button>
              </div>
            </div>
          )}
          <SolutionForm
            initialProblemStatement={discoveryData?.problemStatement}
            initialTargetUser={discoveryData?.targetUser}
          />
        </>
      )}
    </div>
  )
}
