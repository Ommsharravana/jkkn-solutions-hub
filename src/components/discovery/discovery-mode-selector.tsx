'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Zap, Compass, Sparkles, Check } from 'lucide-react'
import { QuickCapture } from './quick-capture'
import { GuidedWizard } from './guided-wizard'
import { StudioMode } from './studio-mode'
import {
  type DiscoveryMode,
  type DiscoveryData,
  type UserRole,
  getDefaultDiscoveryMode,
} from './types'

interface DiscoveryModeSelectorProps {
  userRole: UserRole
  onComplete: (data: Partial<DiscoveryData>) => void
  initialData?: Partial<DiscoveryData>
}

const MODES = [
  {
    id: 'quick' as const,
    name: 'Quick Capture',
    description: 'Essential fields only. Deep dive later.',
    icon: Zap,
    badge: 'Fast',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    recommended: ['md_caio', 'department_head', 'department_staff', 'client'],
  },
  {
    id: 'guided' as const,
    name: 'Guided Wizard',
    description: '8 steps with optional skipping.',
    icon: Compass,
    badge: 'Thorough',
    badgeColor: 'bg-blue-100 text-blue-700',
    recommended: ['builder', 'cohort_member', 'production_learner'],
  },
  {
    id: 'studio' as const,
    name: 'Studio Mode',
    description: 'AI coach + full flywheel experience.',
    icon: Sparkles,
    badge: 'Deep',
    badgeColor: 'bg-purple-100 text-purple-700',
    recommended: ['jicate_staff'],
  },
]

export function DiscoveryModeSelector({
  userRole,
  onComplete,
  initialData,
}: DiscoveryModeSelectorProps) {
  const defaultMode = getDefaultDiscoveryMode(userRole)
  const [selectedMode, setSelectedMode] = useState<DiscoveryMode | null>(null)
  const [activeMode, setActiveMode] = useState<DiscoveryMode | null>(initialData?.mode || null)

  // If we have an active mode, show that component
  if (activeMode === 'quick') {
    return (
      <QuickCapture
        onComplete={onComplete}
        onSwitchMode={(mode) => setActiveMode(mode)}
        initialData={initialData}
      />
    )
  }

  if (activeMode === 'guided') {
    return (
      <GuidedWizard
        onComplete={onComplete}
        onSwitchMode={(mode) => setActiveMode(mode)}
        initialData={initialData}
      />
    )
  }

  if (activeMode === 'studio') {
    return (
      <StudioMode
        onComplete={onComplete}
        onSwitchMode={(mode) => setActiveMode(mode)}
        initialData={initialData}
      />
    )
  }

  // Mode selection screen
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">How would you like to discover?</h2>
        <p className="text-muted-foreground">
          Choose based on how much time you have and how deep you need to go.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map((mode) => {
          const Icon = mode.icon
          const isRecommended = mode.recommended.includes(userRole)
          const isSelected = selectedMode === mode.id
          const isDefault = mode.id === defaultMode

          return (
            <Card
              key={mode.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary',
                isDefault && !selectedMode && 'ring-2 ring-primary/50'
              )}
              onClick={() => setSelectedMode(mode.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    {isDefault && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                    <Badge className={cn('text-xs', mode.badgeColor)}>
                      {mode.badge}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{mode.name}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isSelected && (
                  <div className="flex items-center gap-2 text-primary text-sm">
                    <Check className="h-4 w-4" />
                    Selected
                  </div>
                )}
                {isRecommended && !isSelected && (
                  <p className="text-xs text-muted-foreground">
                    Recommended for your role
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center">
        <button
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-colors',
            selectedMode || defaultMode
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          onClick={() => setActiveMode(selectedMode || defaultMode)}
          disabled={!selectedMode && !defaultMode}
        >
          Start Discovery
        </button>
      </div>
    </div>
  )
}
