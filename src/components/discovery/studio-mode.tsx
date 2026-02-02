'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Sparkles,
  ExternalLink,
  Link2,
  CheckCircle,
  ArrowRight,
  Bot,
  Target,
  Compass,
  Gem,
  Workflow,
} from 'lucide-react'
import type { DiscoveryData } from './types'

interface StudioModeProps {
  onComplete: (data: Partial<DiscoveryData>) => void
  onSwitchMode: (mode: 'quick' | 'guided') => void
  initialData?: Partial<DiscoveryData>
}

const STUDIO_URL = 'https://jkkn-solution-studio.vercel.app'
const ALLOWED_DOMAINS = ['jkkn-solution-studio.vercel.app', 'lovable.dev']

// Validate URL format and domain
function isValidStudioUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) {
    return { valid: false, error: 'URL is required' }
  }

  try {
    const parsedUrl = new URL(url)

    // Only allow https
    if (parsedUrl.protocol !== 'https:') {
      return { valid: false, error: 'URL must use HTTPS' }
    }

    // Check if domain is allowed
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    )

    if (!isAllowedDomain) {
      return { valid: false, error: 'URL must be from Solution Studio or Lovable' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

export function StudioMode({ onComplete, onSwitchMode, initialData }: StudioModeProps) {
  const [studioProjectUrl, setStudioProjectUrl] = useState(initialData?.lovableProjectUrl || '')
  const [isLinked, setIsLinked] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  const handleLinkStudio = () => {
    const validation = isValidStudioUrl(studioProjectUrl)
    if (validation.valid) {
      setIsLinked(true)
      setUrlError(null)
    } else {
      setUrlError(validation.error || 'Invalid URL')
      setIsLinked(false)
    }
  }

  const handleComplete = () => {
    // Pass through any existing initialData fields plus studio-specific data
    onComplete({
      ...initialData,
      mode: 'studio',
      completedSteps: [1, 2, 3, 4, 5],
      completionPercentage: 62,
      lovableProjectUrl: studioProjectUrl,
    })
  }

  return (
    <div className="space-y-6">
      {/* Studio Introduction */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>JKKN Solution Studio</CardTitle>
              <CardDescription>
                AI-guided Problem-to-Impact Flywheel experience
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Solution Studio provides an AI coach that guides you through deep problem discovery,
            helps classify your workflow type, and generates optimized prompts for building.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Bot, label: 'AI Coach', desc: 'Guided questions' },
              { icon: Target, label: 'Problem Discovery', desc: '5 key questions' },
              { icon: Gem, label: 'Value Validation', desc: 'Desperate user test' },
              { icon: Workflow, label: 'Workflow Types', desc: '10 classifications' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-start gap-2 p-3 rounded-lg bg-background"
              >
                <feature.icon className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={() => window.open(STUDIO_URL, '_blank', 'noopener,noreferrer')}
          >
            Open Solution Studio
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Link Existing Studio Project */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Already have a Studio project?</CardTitle>
          <CardDescription>
            Link your Solution Studio cycle to import discovery data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="studioUrl" className="sr-only">Studio Project URL</Label>
              <Input
                id="studioUrl"
                placeholder="Paste your Solution Studio project URL..."
                value={studioProjectUrl}
                onChange={(e) => {
                  setStudioProjectUrl(e.target.value)
                  setIsLinked(false)
                }}
              />
            </div>
            <Button
              variant={isLinked ? 'secondary' : 'default'}
              onClick={handleLinkStudio}
              disabled={!studioProjectUrl}
            >
              {isLinked ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Linked
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1" />
                  Link
                </>
              )}
            </Button>
          </div>

          {urlError && (
            <p className="text-sm text-destructive">{urlError}</p>
          )}

          {isLinked && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Studio project linked. Discovery data will be imported when you complete.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* The 8 Steps Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">The 8-Step Flywheel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              'Problem Discovery',
              'Context Discovery',
              'Value Discovery',
              'Workflow Type',
              'Prompt Generation',
              'Building',
              'Deployment',
              'Impact Discovery',
            ].map((step, idx) => (
              <div
                key={step}
                className="p-2 rounded bg-muted text-center"
              >
                <span className="font-medium">{idx + 1}.</span> {step}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center">
            Complete all 8 steps in Solution Studio for maximum learning and solution quality.
          </p>
        </CardFooter>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => onSwitchMode('guided')}>
          Use Guided Wizard Instead
        </Button>
        <Button onClick={handleComplete} disabled={!isLinked}>
          Import & Continue
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
