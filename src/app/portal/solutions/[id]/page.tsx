'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Hammer,
  BookOpen,
  Video,
  Calendar,
  Clock,
  CheckCircle,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  getClientSolutionById,
  getSolutionProgress,
  getPhaseStatusLabel,
  getDeliverableStatusLabel,
  formatCurrency,
  type PortalSolution,
} from '@/services/portal'
import type { SolutionType, SolutionStatus, PhaseStatus, DeliverableStatus } from '@/types/database'
import { format, formatDistanceToNow } from 'date-fns'

const typeConfig: Record<SolutionType, { icon: React.ElementType; color: string; label: string }> = {
  software: { icon: Hammer, color: 'text-blue-600 bg-blue-50', label: 'Software' },
  training: { icon: BookOpen, color: 'text-green-600 bg-green-50', label: 'Training' },
  content: { icon: Video, color: 'text-purple-600 bg-purple-50', label: 'Content' },
}

const statusConfig: Record<SolutionStatus, { color: string; label: string }> = {
  active: { color: 'bg-emerald-100 text-emerald-700', label: 'Active' },
  on_hold: { color: 'bg-amber-100 text-amber-700', label: 'On Hold' },
  completed: { color: 'bg-blue-100 text-blue-700', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
  in_amc: { color: 'bg-indigo-100 text-indigo-700', label: 'In AMC' },
}

const phaseStatusColors: Record<PhaseStatus, string> = {
  prospecting: 'bg-gray-100 text-gray-700',
  discovery: 'bg-gray-100 text-gray-700',
  prd_writing: 'bg-blue-100 text-blue-700',
  prototype_building: 'bg-blue-100 text-blue-700',
  client_demo: 'bg-amber-100 text-amber-700',
  revisions: 'bg-orange-100 text-orange-700',
  approved: 'bg-emerald-100 text-emerald-700',
  deploying: 'bg-indigo-100 text-indigo-700',
  training: 'bg-purple-100 text-purple-700',
  live: 'bg-emerald-100 text-emerald-700',
  in_amc: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
}

const deliverableStatusColors: Record<DeliverableStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  revision: 'bg-orange-100 text-orange-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function PortalSolutionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [solution, setSolution] = useState<PortalSolution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const solutionId = params.id as string

  useEffect(() => {
    async function loadSolution() {
      if (!user?.id || !solutionId) return

      try {
        setLoading(true)
        const data = await getClientSolutionById(user.id, solutionId)
        if (!data) {
          setError('Solution not found')
          return
        }
        setSolution(data)
      } catch (err) {
        console.error('Error loading solution:', err)
        setError('Failed to load solution')
      } finally {
        setLoading(false)
      }
    }

    loadSolution()
  }, [user?.id, solutionId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !solution) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{error || 'Solution not found'}</p>
            <Button className="mt-4" onClick={() => router.push('/portal/solutions')} variant="outline">
              Back to Solutions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = typeConfig[solution.solution_type]
  const status = statusConfig[solution.status]
  const Icon = config.icon
  const progress = getSolutionProgress(solution)

  // Extract nested data
  const phases = solution.phases || []
  const trainingProgram = Array.isArray(solution.training_program)
    ? solution.training_program[0]
    : solution.training_program
  const sessions: { id: string; session_number: number | null; title: string | null; status: string; scheduled_at: string | null }[] = trainingProgram?.sessions || []
  const contentOrders = solution.content_orders || []

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/portal/solutions')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Solutions
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.color.split(' ')[1]}`}>
            <Icon className={`h-8 w-8 ${config.color.split(' ')[0]}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{config.label}</Badge>
              <Badge className={status.color} variant="secondary">
                {status.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{solution.title}</h1>
            <p className="text-sm text-muted-foreground font-mono">{solution.solution_code}</p>
          </div>
        </div>

        {solution.final_price && (
          <Card className="md:min-w-[200px]">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Solution Value</p>
              <p className="text-2xl font-bold">{formatCurrency(solution.final_price)}</p>
              {solution.partner_discount_applied > 0 && (
                <p className="text-xs text-emerald-600">
                  {Math.round(solution.partner_discount_applied * 100)}% partner discount applied
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-lg font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {solution.started_date
                ? `Started ${format(new Date(solution.started_date), 'MMM d, yyyy')}`
                : solution.created_at
                  ? `Created ${formatDistanceToNow(new Date(solution.created_at), { addSuffix: true })}`
                  : 'No start date'}
            </div>
            {solution.target_completion && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Target: {format(new Date(solution.target_completion), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {(solution.problem_statement || solution.description) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About This Solution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {solution.problem_statement && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Problem Statement</p>
                <p className="text-sm">{solution.problem_statement}</p>
              </div>
            )}
            {solution.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{solution.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Type-specific content */}
      {solution.solution_type === 'software' && phases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Development Phases</CardTitle>
            <CardDescription>Track the progress of each development phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phases
                .sort((a, b) => a.phase_number - b.phase_number)
                .map((phase) => (
                  <div
                    key={phase.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium">
                        {phase.phase_number}
                      </div>
                      <div>
                        <p className="font-medium">{phase.title}</p>
                        {phase.description && (
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {phase.production_url && (
                        <a
                          href={phase.production_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Live
                        </a>
                      )}
                      <Badge className={phaseStatusColors[phase.status]} variant="secondary">
                        {getPhaseStatusLabel(phase.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {solution.solution_type === 'training' && trainingProgram && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Program</CardTitle>
            <CardDescription>
              {trainingProgram.program_type?.replace(/_/g, ' ')} |{' '}
              {trainingProgram.participant_count} participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {[...sessions]
                  .sort((a: { session_number?: number | null }, b: { session_number?: number | null }) => (a.session_number || 0) - (b.session_number || 0))
                  .map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">
                            Session {session.session_number}: {session.title || 'Untitled'}
                          </p>
                          {session.scheduled_at && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(session.scheduled_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          session.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sessions scheduled yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {solution.solution_type === 'content' && contentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Orders</CardTitle>
            <CardDescription>View deliverables for each content order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {contentOrders.map((order) => (
                <div key={order.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {order.order_type?.replace(/_/g, ' ')} Order
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.quantity} items | {order.division} division
                      </p>
                    </div>
                    {order.due_date && (
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(order.due_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  {order.deliverables && order.deliverables.length > 0 ? (
                    <div className="space-y-2 pl-4 border-l-2">
                      {order.deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{deliverable.title}</span>
                          </div>
                          <Badge
                            className={deliverableStatusColors[deliverable.status]}
                            variant="secondary"
                          >
                            {getDeliverableStatusLabel(deliverable.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-4">
                      No deliverables yet
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Card */}
      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-medium">Need assistance?</p>
              <p className="text-sm text-muted-foreground">
                Contact your account manager for any questions about this solution.
              </p>
            </div>
            <Link href="/portal/deliverables">
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                View Deliverables
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
