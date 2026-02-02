'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileText,
  Clock,
  CheckCircle,
  Upload,
  AlertCircle,
  Eye,
} from 'lucide-react'
import {
  getMyWork,
  getLearnerByUserId,
  statusColors,
} from '@/services/production-portal'
import { useAuth } from '@/components/providers/auth-provider'
import type { DeliverableStatus } from '@/types/database'

const statusIcons: Record<DeliverableStatus, typeof Clock> = {
  pending: Clock,
  in_progress: FileText,
  review: Eye,
  revision: AlertCircle,
  approved: CheckCircle,
  rejected: AlertCircle,
}

export default function MyWorkPage() {
  const { user } = useAuth()

  const { data: learner, isLoading: learnerLoading } = useQuery({
    queryKey: ['production-learner', user?.id],
    queryFn: () => getLearnerByUserId(user!.id),
    enabled: !!user?.id,
  })

  const { data: work, isLoading: workLoading } = useQuery({
    queryKey: ['production-my-work', learner?.id],
    queryFn: () => getMyWork(learner!.id),
    enabled: !!learner?.id,
  })

  const isLoading = learnerLoading || workLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const activeWork = work?.filter(
    (w) => {
      const status = Array.isArray(w.deliverable) ? w.deliverable[0]?.status : w.deliverable?.status
      return status !== 'approved' && status !== 'rejected'
    }
  ) || []

  const completedWork = work?.filter(
    (w) => {
      const status = Array.isArray(w.deliverable) ? w.deliverable[0]?.status : w.deliverable?.status
      return status === 'approved' || status === 'rejected'
    }
  ) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Work</h1>
        <p className="text-muted-foreground">
          Track and manage your assigned deliverables
        </p>
      </div>

      {/* Active Work */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active ({activeWork.length})</h2>

        {activeWork.length > 0 ? (
          <div className="space-y-4">
            {activeWork.map((item) => {
              const deliverable = Array.isArray(item.deliverable)
                ? item.deliverable[0]
                : item.deliverable
              const status = deliverable?.status as DeliverableStatus || 'pending'
              const StatusIcon = statusIcons[status] || Clock

              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {deliverable?.title || 'Untitled Deliverable'}
                        </CardTitle>
                        <CardDescription>
                          Assigned {new Date(item.assigned_at || '').toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {deliverable?.description?.slice(0, 100) || 'No description'}
                        {(deliverable?.description?.length || 0) > 100 && '...'}
                      </div>
                      <div className="flex gap-2">
                        {status === 'in_progress' && (
                          <Button asChild>
                            <Link href={`/production/submit/${deliverable?.id}`}>
                              <Upload className="h-4 w-4 mr-2" />
                              Submit Work
                            </Link>
                          </Button>
                        )}
                        {status === 'revision' && (
                          <Button asChild variant="outline">
                            <Link href={`/production/submit/${deliverable?.id}`}>
                              <Upload className="h-4 w-4 mr-2" />
                              Resubmit
                            </Link>
                          </Button>
                        )}
                        {status === 'review' && (
                          <Badge variant="secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            Under Review
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No active work</p>
              <Button asChild className="mt-4">
                <Link href="/production/queue">Browse Available Work</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Work */}
      {completedWork.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Completed ({completedWork.length})</h2>

          <div className="space-y-4">
            {completedWork.map((item) => {
              const deliverable = Array.isArray(item.deliverable)
                ? item.deliverable[0]
                : item.deliverable
              const status = deliverable?.status as DeliverableStatus || 'approved'
              const StatusIcon = statusIcons[status] || CheckCircle

              return (
                <Card key={item.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {deliverable?.title || 'Untitled Deliverable'}
                        </CardTitle>
                        <CardDescription>
                          Completed {item.completed_at
                            ? new Date(item.completed_at).toLocaleDateString()
                            : 'N/A'}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  {item.quality_rating && (
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Quality Rating:</span>
                        <Badge variant="outline">{item.quality_rating}/5</Badge>
                        {item.earnings && (
                          <>
                            <span className="text-muted-foreground ml-4">Earned:</span>
                            <span className="font-medium text-green-600">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(item.earnings)}
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
