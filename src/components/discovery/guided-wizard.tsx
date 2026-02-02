'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Compass,
  Target,
  Gem,
  Workflow,
  Wand2,
  Hammer,
  Rocket,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WORKFLOW_TYPES, type DiscoveryData, type WorkflowType } from './types'

interface GuidedWizardProps {
  onComplete: (data: Partial<DiscoveryData>) => void
  onSwitchMode: (mode: 'quick' | 'studio') => void
  initialData?: Partial<DiscoveryData>
}

const STEPS = [
  { id: 1, name: 'Problem', icon: Target, description: 'Define the problem clearly' },
  { id: 2, name: 'Context', icon: Compass, description: 'Understand who and when' },
  { id: 3, name: 'Value', icon: Gem, description: 'Validate the need' },
  { id: 4, name: 'Workflow', icon: Workflow, description: 'Classify the solution type' },
  { id: 5, name: 'Prompt', icon: Wand2, description: 'Prepare for building' },
  { id: 6, name: 'Building', icon: Hammer, description: 'Track the build' },
  { id: 7, name: 'Deploy', icon: Rocket, description: 'Go live' },
  { id: 8, name: 'Impact', icon: BarChart3, description: 'Measure results' },
]

export function GuidedWizard({ onComplete, onSwitchMode, initialData }: GuidedWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>(initialData?.completedSteps || [])
  const [formData, setFormData] = useState<Partial<DiscoveryData>>({
    mode: 'guided',
    ...initialData,
  })

  const progress = Math.round((completedSteps.length / STEPS.length) * 100)

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    onComplete({
      ...formData,
      completedSteps,
      completionPercentage: progress,
    })
  }

  const updateField = <K extends keyof DiscoveryData>(field: K, value: DiscoveryData[K]) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Discovery Progress</span>
          <span className="font-medium">{progress}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = completedSteps.includes(step.id)
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]',
                isActive && 'bg-primary/10',
                !isActive && 'hover:bg-muted'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isCompleted && 'bg-green-500 text-white',
                  isActive && !isCompleted && 'bg-primary text-primary-foreground',
                  !isActive && !isCompleted && 'bg-muted'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn('text-xs', isActive && 'font-medium')}>{step.name}</span>
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Step {currentStep}: {STEPS[currentStep - 1].name}
                {completedSteps.includes(currentStep) && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Completed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Problem Discovery */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What problem are we solving?</Label>
                <Textarea
                  placeholder="Describe the problem clearly..."
                  value={formData.problemStatement || ''}
                  onChange={(e) => updateField('problemStatement', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Who experiences this problem?</Label>
                <Input
                  placeholder="e.g., First-year students, Lab technicians..."
                  value={formData.targetUser || ''}
                  onChange={(e) => updateField('targetUser', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>What do they currently do to solve it?</Label>
                <Textarea
                  placeholder="Describe their current workaround..."
                  value={formData.currentSolution || ''}
                  onChange={(e) => updateField('currentSolution', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Context Discovery */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Who specifically experiences this?</Label>
                <Input
                  placeholder="Be specific: role, department, year..."
                  value={formData.whoExperiences || ''}
                  onChange={(e) => updateField('whoExperiences', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>When does this problem occur?</Label>
                <Input
                  placeholder="e.g., During exams, Start of semester..."
                  value={formData.whenOccurs || ''}
                  onChange={(e) => updateField('whenOccurs', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>How painful is this problem?</Label>
                <RadioGroup
                  value={formData.howPainful || ''}
                  onValueChange={(value) => updateField('howPainful', value as DiscoveryData['howPainful'])}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low">Low - Mild inconvenience</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium - Regular frustration</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high">High - Major pain point</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="critical" id="critical" />
                    <Label htmlFor="critical">Critical - Urgent, blocking work</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>How often does this occur?</Label>
                <Input
                  placeholder="e.g., Daily, Weekly, Every semester..."
                  value={formData.frequency || ''}
                  onChange={(e) => updateField('frequency', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Value Discovery */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Desperate User Test: Would someone pay for this solution?</Label>
                <RadioGroup
                  value={formData.willingToPay ? 'yes' : 'no'}
                  onValueChange={(value) => updateField('willingToPay', value === 'yes')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pay-yes" />
                    <Label htmlFor="pay-yes">Yes - Clear willingness to pay/invest time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pay-no" />
                    <Label htmlFor="pay-no">No - Nice to have, not desperate</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>What alternatives have they tried?</Label>
                <Textarea
                  placeholder="List any tools, processes, or workarounds..."
                  value={formData.alternativesConsidered || ''}
                  onChange={(e) => updateField('alternativesConsidered', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Workflow Classification */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What type of workflow is this solution?</Label>
                <Select
                  value={formData.workflowType || ''}
                  onValueChange={(value) => updateField('workflowType', value as WorkflowType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_TYPES.map((wf) => (
                      <SelectItem key={wf.value} value={wf.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{wf.label}</span>
                          <span className="text-xs text-muted-foreground">{wf.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Why this workflow type?</Label>
                <Textarea
                  placeholder="Explain why this classification fits..."
                  value={formData.workflowJustification || ''}
                  onChange={(e) => updateField('workflowJustification', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 5: Prompt Generation */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Knowledge Document</Label>
                <Textarea
                  placeholder="Capture key context: domain terms, user personas, data model ideas..."
                  value={formData.projectKnowledge || ''}
                  onChange={(e) => updateField('projectKnowledge', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Lovable Prompt</Label>
                <Textarea
                  placeholder="Draft the first prompt for building in Lovable..."
                  value={formData.lovablePrompt || ''}
                  onChange={(e) => updateField('lovablePrompt', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 6: Building */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lovable Project URL</Label>
                <Input
                  placeholder="https://lovable.dev/projects/..."
                  value={formData.lovableProjectUrl || ''}
                  onChange={(e) => updateField('lovableProjectUrl', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Build Notes</Label>
                <Textarea
                  placeholder="Track key decisions, challenges, and learnings..."
                  value={formData.buildNotes || ''}
                  onChange={(e) => updateField('buildNotes', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 7: Deployment */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Live Deployment URL</Label>
                <Input
                  placeholder="https://..."
                  value={formData.deploymentUrl || ''}
                  onChange={(e) => updateField('deploymentUrl', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deployment Date</Label>
                <Input
                  type="date"
                  value={formData.deploymentDate || ''}
                  onChange={(e) => updateField('deploymentDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 8: Impact Discovery */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Users Served</Label>
                <Input
                  type="number"
                  placeholder="Number of users"
                  value={formData.usersServed || ''}
                  onChange={(e) => updateField('usersServed', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Impact Metrics</Label>
                <Textarea
                  placeholder="Time saved, errors reduced, satisfaction scores..."
                  value={formData.impactMetrics || ''}
                  onChange={(e) => updateField('impactMetrics', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>User Feedback</Label>
                <Textarea
                  placeholder="What are users saying?"
                  value={formData.feedback || ''}
                  onChange={(e) => updateField('feedback', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button variant="ghost" onClick={handleSkip}>
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onSwitchMode('quick')}>
            Switch to Quick Mode
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Complete Discovery
              <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
