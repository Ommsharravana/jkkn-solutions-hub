'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SolutionStatusBadge, MouStatusBadge } from '@/components/solutions'
import { SessionCard } from '@/components/training'
import { PhaseCard } from '@/components/software'
import { ContentDeliverablesTab } from '@/components/content'
import { useSolution, useUpdateSolution, useDeleteSolution } from '@/hooks/use-solutions'
import {
  useTrainingProgramBySolution,
  useSessionsByProgram,
  useCreateTrainingSession,
} from '@/hooks/use-training'
import { useSolutionPhases, useNextPhaseNumber, useCreatePhase } from '@/hooks/use-phases'
import { useMouBySolution } from '@/hooks/use-mous'
import { useAuth } from '@/hooks/use-auth'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Hammer,
  BookOpen,
  Video,
  User,
  FileText,
  CreditCard,
  Trash2,
  ExternalLink,
  Plus,
  MapPin,
  Users,
  Clock,
  Award,
  GitBranch,
  ScrollText,
  AlertTriangle,
} from 'lucide-react'
import { PublicationForm, PublicationCard } from '@/components/accreditation'
import { usePublications } from '@/hooks/use-publications'
import type { SolutionStatus, SolutionType } from '@/types/database'
import {
  getProgramTypeLabel,
  getTrackLabel,
  getLocationPreferenceLabel,
} from '@/services/training-programs'

interface PageProps {
  params: Promise<{ id: string }>
}

const typeConfig: Record<SolutionType, { icon: React.ElementType; color: string; label: string }> = {
  software: { icon: Hammer, color: 'text-blue-600', label: 'Software Solution' },
  training: { icon: BookOpen, color: 'text-green-600', label: 'Training Program' },
  content: { icon: Video, color: 'text-purple-600', label: 'Content Production' },
}

function formatCurrency(amount: number | null): string {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SolutionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: solution, isLoading, error } = useSolution(id)
  const updateSolution = useUpdateSolution()
  const deleteSolution = useDeleteSolution()

  const handleStatusChange = async (newStatus: SolutionStatus) => {
    if (!solution) return

    try {
      await updateSolution.mutateAsync({
        id: solution.id,
        input: { status: newStatus },
      })
      toast.success('Status updated successfully')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!solution) return
    if (!confirm('Are you sure you want to delete this solution? This action cannot be undone.')) {
      return
    }

    try {
      await deleteSolution.mutateAsync(solution.id)
      toast.success('Solution deleted')
      router.push('/solutions')
    } catch {
      toast.error('Failed to delete solution')
    }
  }

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

  if (error || !solution) {
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
              The solution you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const config = typeConfig[solution.solution_type]
  const Icon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/solutions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-5 w-5 ${config.color}`} />
              <Badge variant="outline">{config.label}</Badge>
              <SolutionStatusBadge status={solution.status} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{solution.title}</h1>
            <p className="text-muted-foreground font-mono">{solution.solution_code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={solution.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="in_amc">In AMC</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {solution.solution_type === 'software' && (
            <TabsTrigger value="phases">Phases</TabsTrigger>
          )}
          {solution.solution_type === 'training' && (
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          )}
          {solution.solution_type === 'content' && (
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          )}
          <TabsTrigger value="publications">Publications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Solution Details */}
            <Card>
              <CardHeader>
                <CardTitle>Solution Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {solution.problem_statement && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Problem Statement
                    </div>
                    <p className="text-sm">{solution.problem_statement}</p>
                  </div>
                )}

                {solution.description && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </div>
                    <p className="text-sm">{solution.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Started
                    </div>
                    <p className="text-sm">
                      {solution.started_date
                        ? format(new Date(solution.started_date), 'PPP')
                        : 'Not started'}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Target Completion
                    </div>
                    <p className="text-sm">
                      {solution.target_completion
                        ? format(new Date(solution.target_completion), 'PPP')
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Client & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {solution.client && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Client
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{solution.client.name}</p>
                      {solution.client.partner_status !== 'standard' && (
                        <Badge variant="secondary" className="text-xs">
                          {solution.client.partner_status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    {solution.client.contact_person && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" /> {solution.client.contact_person}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Pricing
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Base Price</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(solution.base_price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Final Price</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(solution.final_price)}
                      </p>
                    </div>
                  </div>
                  {solution.partner_discount_applied > 0 && (
                    <Badge variant="outline" className="mt-2 text-green-600">
                      {Math.round(solution.partner_discount_applied * 100)}% Partner Discount Applied
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {format(new Date(solution.created_at), 'dd MMM yyyy')}
                </div>
              </CardContent>
            </Card>

            {solution.solution_type === 'software' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Phases</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Total phases</p>
                </CardContent>
              </Card>
            )}

            {solution.solution_type === 'training' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Scheduled sessions</p>
                </CardContent>
              </Card>
            )}

            {solution.solution_type === 'content' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deliverables</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Total deliverables</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(0)}</div>
                <p className="text-xs text-muted-foreground">Received</p>
              </CardContent>
            </Card>

            {/* MoU Card */}
            <MouQuickCard solutionId={solution.id} />

            {solution.intent_prd_id && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">From Intent</CardTitle>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`#`} target="_blank" rel="noopener noreferrer">
                      View PRD
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Phases Tab (Software) */}
        {solution.solution_type === 'software' && (
          <SoftwarePhasesTab
            solutionId={solution.id}
            departmentId={solution.lead_department_id}
          />
        )}

        {/* Sessions Tab (Training) */}
        {solution.solution_type === 'training' && (
          <InternalTrainingSessionsTab solutionId={solution.id} />
        )}

        {/* Deliverables Tab (Content) */}
        {solution.solution_type === 'content' && (
          <ContentDeliverablesTab solutionId={solution.id} />
        )}

        {/* Publications Tab */}
        <PublicationsTab solutionId={solution.id} />

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                Payment history and revenue splits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-10">
                No payments recorded yet. Payments module coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle>Communications</CardTitle>
              <CardDescription>
                Client communication history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-10">
                No communications logged yet. Communications module coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Training Sessions Tab Component
function InternalTrainingSessionsTab({ solutionId }: { solutionId: string }) {
  const { data: program } = useTrainingProgramBySolution(solutionId)
  const { data: sessions, isLoading } = useSessionsByProgram(program?.id || '')

  return (
    <TabsContent value="sessions">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Training Sessions</CardTitle>
              <CardDescription>
                Schedule and manage training sessions for this program
              </CardDescription>
            </div>
            {program && (
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              No sessions scheduled yet.
            </p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

// Software Phases Tab Component
function SoftwarePhasesTab({
  solutionId,
  departmentId,
}: {
  solutionId: string
  departmentId: string
}) {
  const { user } = useAuth()
  const { data: phases, isLoading } = useSolutionPhases(solutionId)
  const { data: nextPhaseNumber } = useNextPhaseNumber(solutionId)
  const createPhase = useCreatePhase()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newPhaseTitle, setNewPhaseTitle] = useState('')
  const [newPhaseDescription, setNewPhaseDescription] = useState('')
  const [newPhaseValue, setNewPhaseValue] = useState('')

  const handleCreatePhase = async () => {
    if (!newPhaseTitle.trim() || !user) {
      toast.error('Please enter a title')
      return
    }

    try {
      await createPhase.mutateAsync({
        solution_id: solutionId,
        phase_number: nextPhaseNumber || 1,
        title: newPhaseTitle.trim(),
        description: newPhaseDescription.trim() || undefined,
        owner_department_id: departmentId,
        estimated_value: newPhaseValue ? parseFloat(newPhaseValue) : undefined,
        created_by: user.id,
      })
      toast.success('Phase created successfully')
      setIsCreateOpen(false)
      setNewPhaseTitle('')
      setNewPhaseDescription('')
      setNewPhaseValue('')
    } catch {
      toast.error('Failed to create phase')
    }
  }

  return (
    <TabsContent value="phases">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Development Phases
            </CardTitle>
            <CardDescription>
              Manage phases for this software solution
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Phase
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Phase</DialogTitle>
                <DialogDescription>
                  Add a new development phase to this solution. This will be Phase{' '}
                  {nextPhaseNumber || 1}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phase-title">Title *</Label>
                  <Input
                    id="phase-title"
                    value={newPhaseTitle}
                    onChange={(e) => setNewPhaseTitle(e.target.value)}
                    placeholder="e.g., Core Features"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phase-description">Description</Label>
                  <Textarea
                    id="phase-description"
                    value={newPhaseDescription}
                    onChange={(e) => setNewPhaseDescription(e.target.value)}
                    placeholder="Describe what this phase will include..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phase-value">Estimated Value (INR)</Label>
                  <Input
                    id="phase-value"
                    type="number"
                    value={newPhaseValue}
                    onChange={(e) => setNewPhaseValue(e.target.value)}
                    placeholder="e.g., 100000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePhase} disabled={createPhase.isPending}>
                  {createPhase.isPending ? 'Creating...' : 'Create Phase'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : phases && phases.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {phases.map((phase) => (
                <PhaseCard key={phase.id} phase={phase} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Phases Yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Add your first development phase to start tracking progress.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Phase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

// Publications Tab Component
function PublicationsTab({ solutionId }: { solutionId: string }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { data: publications, isLoading } = usePublications({ solution_id: solutionId })

  const handleCreateSuccess = () => {
    setIsCreateOpen(false)
  }

  return (
    <TabsContent value="publications">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Publications
              </CardTitle>
              <CardDescription>
                Research publications linked to this solution for NIRF/NAAC
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Publication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Publication</DialogTitle>
                  <DialogDescription>
                    Create a publication record linked to this solution
                  </DialogDescription>
                </DialogHeader>
                <PublicationForm
                  solutionId={solutionId}
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreateOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-[200px]" />
              ))}
            </div>
          ) : publications && publications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {publications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Publications Yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Add publications to track research output from this solution for accreditation.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Publication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}

// MoU Quick Card Component
function MouQuickCard({ solutionId }: { solutionId: string }) {
  const { data: mou, isLoading } = useMouBySolution(solutionId)

  if (isLoading) {
    return <Skeleton className="h-[100px]" />
  }

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysUntilExpiry = mou ? getDaysUntilExpiry(mou.expiry_date) : null
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30

  return (
    <Card className={isExpiringSoon ? 'border-amber-300' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">MoU</CardTitle>
        {isExpiringSoon ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <ScrollText className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {mou ? (
          <>
            <div className="flex items-center gap-2">
              <MouStatusBadge status={mou.status} />
            </div>
            {isExpiringSoon && (
              <p className="text-xs text-amber-600 mt-1">
                Expires in {daysUntilExpiry} days
              </p>
            )}
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link href={`/solutions/${solutionId}/mou`}>View MoU</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">No MoU created</p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/solutions/${solutionId}/mou`}>
                <Plus className="h-3 w-3 mr-1" />
                Create MoU
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
