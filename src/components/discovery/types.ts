/**
 * Discovery Mode Types
 *
 * Three modes for solution discovery based on user role and preference:
 * - quick: Minimal form for fast capture (MD, HOD, Staff)
 * - guided: 8-step wizard with optional steps (Builders, Cohort)
 * - studio: Full AI-coached flywheel experience (JICATE)
 */

// Re-export UserRole from auth for consistency
export type { UserRole } from '@/types/auth'
import type { UserRole } from '@/types/auth'

export type DiscoveryMode = 'quick' | 'guided' | 'studio'

/**
 * The 8 steps from Solution Studio's Problem-to-Impact Flywheel
 */
export interface DiscoveryStep {
  id: number
  name: string
  description: string
  required: boolean
  fields: DiscoveryField[]
}

export interface DiscoveryField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'number'
  placeholder?: string
  options?: { value: string; label: string }[]
  required: boolean
}

/**
 * Discovery data collected through any mode
 */
export interface DiscoveryData {
  mode: DiscoveryMode
  completedSteps: number[]
  completionPercentage: number

  // Step 1: Problem Discovery
  problemStatement?: string
  targetUser?: string
  currentSolution?: string
  painPoints?: string[]

  // Step 2: Context Discovery
  whoExperiences?: string
  whenOccurs?: string
  howPainful?: 'low' | 'medium' | 'high' | 'critical'
  frequency?: string

  // Step 3: Value Discovery
  desperateUserTest?: boolean
  willingToPay?: boolean
  alternativesConsidered?: string

  // Step 4: Workflow Classification
  workflowType?: WorkflowType
  workflowJustification?: string

  // Step 5: Prompt Generation
  lovablePrompt?: string
  projectKnowledge?: string

  // Step 6: Building
  lovableProjectUrl?: string
  buildNotes?: string

  // Step 7: Deployment
  deploymentUrl?: string
  deploymentDate?: string

  // Step 8: Impact Discovery
  usersServed?: number
  impactMetrics?: string
  feedback?: string
}

/**
 * The 10 workflow types from Solution Studio
 */
export type WorkflowType =
  | 'audit'
  | 'generation'
  | 'transformation'
  | 'classification'
  | 'extraction'
  | 'synthesis'
  | 'prediction'
  | 'recommendation'
  | 'monitoring'
  | 'orchestration'

export const WORKFLOW_TYPES: { value: WorkflowType; label: string; description: string }[] = [
  { value: 'audit', label: 'Audit', description: 'Evaluate quality against criteria' },
  { value: 'generation', label: 'Generation', description: 'Create new content' },
  { value: 'transformation', label: 'Transformation', description: 'Convert format or structure' },
  { value: 'classification', label: 'Classification', description: 'Categorize or route items' },
  { value: 'extraction', label: 'Extraction', description: 'Pull structured data from unstructured' },
  { value: 'synthesis', label: 'Synthesis', description: 'Combine multiple sources' },
  { value: 'prediction', label: 'Prediction', description: 'Forecast outcomes' },
  { value: 'recommendation', label: 'Recommendation', description: 'Suggest actions' },
  { value: 'monitoring', label: 'Monitoring', description: 'Continuous observation' },
  { value: 'orchestration', label: 'Orchestration', description: 'Coordinate multi-step workflows' },
]

/**
 * Get default discovery mode based on user role
 */
export function getDefaultDiscoveryMode(role: UserRole): DiscoveryMode {
  switch (role) {
    case 'md_caio':
    case 'department_head':
    case 'department_staff':
    case 'client':
      return 'quick'
    case 'builder':
    case 'cohort_member':
    case 'production_learner':
      return 'guided'
    case 'jicate_staff':
      return 'studio'
    default:
      return 'quick'
  }
}

/**
 * Calculate discovery completion percentage
 */
export function calculateCompletionPercentage(data: Partial<DiscoveryData>): number {
  const fields = [
    data.problemStatement,
    data.targetUser,
    data.howPainful,
    data.workflowType,
  ]
  const completed = fields.filter(Boolean).length
  return Math.round((completed / fields.length) * 100)
}
