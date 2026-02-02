'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  useMyAssignments,
  useStartPhaseWork,
  useCompletePhaseWork,
  useWithdrawFromPhase,
} from '@/hooks/use-builder-portal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FolderKanban,
  MoreHorizontal,
  Play,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AssignmentStatus } from '@/types/database'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getStatusBadge(status: AssignmentStatus) {
  switch (status) {
    case 'active':
      return <Badge variant="default">Active</Badge>
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">Ready to Start</Badge>
    case 'requested':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending Approval</Badge>
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>
    case 'withdrawn':
      return <Badge variant="destructive">Withdrawn</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getRoleBadge(role: string) {
  return role === 'lead' ? (
    <Badge variant="default">Lead</Badge>
  ) : (
    <Badge variant="outline">Contributor</Badge>
  )
}

export default function AssignmentsPage() {
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [selectedTab, setSelectedTab] = useState('active')
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'complete' | 'withdraw'
    assignmentId: string
    phaseTitle: string
  } | null>(null)

  const startMutation = useStartPhaseWork()
  const completeMutation = useCompletePhaseWork()
  const withdrawMutation = useWithdrawFromPhase()

  useEffect(() => {
    async function fetchBuilderId() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: builder } = await supabase
          .from('builders')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (builder) {
          setBuilderId(builder.id)
        }
      }
      setIsLoadingUser(false)
    }

    fetchBuilderId()
  }, [])

  const { data: assignments, isLoading, error } = useMyAssignments(builderId || '')

  const handleAction = async () => {
    if (!confirmAction || !builderId) return

    try {
      switch (confirmAction.type) {
        case 'start':
          await startMutation.mutateAsync({
            assignmentId: confirmAction.assignmentId,
            builderId,
          })
          toast.success('Assignment started')
          break
        case 'complete':
          await completeMutation.mutateAsync({
            assignmentId: confirmAction.assignmentId,
            builderId,
          })
          toast.success('Assignment marked as completed')
          break
        case 'withdraw':
          await withdrawMutation.mutateAsync({
            assignmentId: confirmAction.assignmentId,
            builderId,
          })
          toast.success('Assignment withdrawn')
          break
      }
    } catch (err) {
      toast.error('Action failed. Please try again.')
    } finally {
      setConfirmAction(null)
    }
  }

  if (isLoadingUser || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to load assignments</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  const activeAssignments = assignments?.filter(
    (a) => a.status === 'active' || a.status === 'approved'
  ) || []
  const pendingAssignments = assignments?.filter((a) => a.status === 'requested') || []
  const completedAssignments = assignments?.filter((a) => a.status === 'completed') || []
  const allAssignments = assignments || []

  const renderAssignmentTable = (items: typeof assignments) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No assignments in this category</p>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phase</TableHead>
            <TableHead>Solution</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">
                {assignment.phase?.title || 'Untitled Phase'}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{assignment.phase?.solution?.solution_code}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {assignment.phase?.solution?.title}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {assignment.phase?.solution?.client?.name || 'No Client'}
              </TableCell>
              <TableCell>
                {assignment.phase?.estimated_value
                  ? formatCurrency(assignment.phase.estimated_value)
                  : '-'}
              </TableCell>
              <TableCell>{getRoleBadge(assignment.role)}</TableCell>
              <TableCell>{getStatusBadge(assignment.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {assignment.phase?.prototype_url && (
                      <DropdownMenuItem asChild>
                        <a
                          href={assignment.phase.prototype_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Prototype
                        </a>
                      </DropdownMenuItem>
                    )}
                    {assignment.status === 'approved' && (
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmAction({
                            type: 'start',
                            assignmentId: assignment.id,
                            phaseTitle: assignment.phase?.title || 'this phase',
                          })
                        }
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Working
                      </DropdownMenuItem>
                    )}
                    {assignment.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmAction({
                            type: 'complete',
                            assignmentId: assignment.id,
                            phaseTitle: assignment.phase?.title || 'this phase',
                          })
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Complete
                      </DropdownMenuItem>
                    )}
                    {(assignment.status === 'requested' ||
                      assignment.status === 'approved' ||
                      assignment.status === 'active') && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          setConfirmAction({
                            type: 'withdraw',
                            assignmentId: assignment.id,
                            phaseTitle: assignment.phase?.title || 'this phase',
                          })
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Withdraw
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Assignments</h1>
        <p className="text-muted-foreground">
          View and manage your phase assignments
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            Active
            {activeAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingAssignments.length > 0 && (
              <Badge variant="outline" className="ml-1 border-yellow-500">
                {pendingAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {completedAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="pt-6">
            <TabsContent value="active" className="m-0">
              {renderAssignmentTable(activeAssignments)}
            </TabsContent>
            <TabsContent value="pending" className="m-0">
              {renderAssignmentTable(pendingAssignments)}
            </TabsContent>
            <TabsContent value="completed" className="m-0">
              {renderAssignmentTable(completedAssignments)}
            </TabsContent>
            <TabsContent value="all" className="m-0">
              {renderAssignmentTable(allAssignments)}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'start' && 'Start Working?'}
              {confirmAction?.type === 'complete' && 'Mark as Completed?'}
              {confirmAction?.type === 'withdraw' && 'Withdraw from Assignment?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'start' &&
                `You are about to start working on "${confirmAction.phaseTitle}". This will change the status to Active.`}
              {confirmAction?.type === 'complete' &&
                `You are about to mark "${confirmAction.phaseTitle}" as completed. Make sure all work is done.`}
              {confirmAction?.type === 'withdraw' &&
                `You are about to withdraw from "${confirmAction.phaseTitle}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={confirmAction?.type === 'withdraw' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmAction?.type === 'start' && 'Start Working'}
              {confirmAction?.type === 'complete' && 'Mark Complete'}
              {confirmAction?.type === 'withdraw' && 'Withdraw'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
