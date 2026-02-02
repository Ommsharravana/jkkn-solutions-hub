'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, ArrowRight } from 'lucide-react'
import type { DiscoveryData } from './types'

interface QuickCaptureProps {
  onComplete: (data: Partial<DiscoveryData>) => void
  onSwitchMode: (mode: 'guided' | 'studio') => void
  initialData?: Partial<DiscoveryData>
}

export function QuickCapture({ onComplete, onSwitchMode, initialData }: QuickCaptureProps) {
  const [formData, setFormData] = useState({
    problemStatement: initialData?.problemStatement || '',
    targetUser: initialData?.targetUser || '',
    howPainful: initialData?.howPainful || '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete({
      mode: 'quick',
      completedSteps: [1],
      completionPercentage: 25,
      problemStatement: formData.problemStatement,
      targetUser: formData.targetUser,
      howPainful: formData.howPainful as DiscoveryData['howPainful'],
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle>Quick Capture</CardTitle>
        </div>
        <CardDescription>
          Capture the essentials now. Deep dive later if needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="problemStatement">What problem are we solving?</Label>
            <Textarea
              id="problemStatement"
              placeholder="Describe the problem in 1-2 sentences..."
              value={formData.problemStatement}
              onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUser">Who has this problem?</Label>
            <Input
              id="targetUser"
              placeholder="e.g., Students, Faculty, Admin staff..."
              value={formData.targetUser}
              onChange={(e) => setFormData({ ...formData, targetUser: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="howPainful">How painful is this problem?</Label>
            <Select
              value={formData.howPainful}
              onValueChange={(value) => setFormData({ ...formData, howPainful: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pain level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Nice to solve</SelectItem>
                <SelectItem value="medium">Medium - Causes inconvenience</SelectItem>
                <SelectItem value="high">High - Major pain point</SelectItem>
                <SelectItem value="critical">Critical - Urgent need</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSwitchMode('guided')}
              >
                Want more depth? Try Guided Wizard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <Button type="submit">
              Save & Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
