'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileText,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react'
import {
  getDeliverableForSubmission,
  submitWork,
  getLearnerByUserId,
  statusColors,
} from '@/services/production-portal'
import { useAuth } from '@/components/providers/auth-provider'
import type { DeliverableStatus } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SubmitWorkPage({ params }: PageProps) {
  const { id: deliverableId } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('')

  const { data: learner, isLoading: learnerLoading } = useQuery({
    queryKey: ['production-learner', user?.id],
    queryFn: () => getLearnerByUserId(user!.id),
    enabled: !!user?.id,
  })

  const { data: deliverable, isLoading: deliverableLoading } = useQuery({
    queryKey: ['deliverable-submission', deliverableId, learner?.id],
    queryFn: () => getDeliverableForSubmission(deliverableId, learner!.id),
    enabled: !!learner?.id && !!deliverableId,
  })

  const submitMutation = useMutation({
    mutationFn: () => submitWork(deliverableId, fileUrl, fileType),
    onSuccess: () => {
      toast.success('Work submitted for review')
      queryClient.invalidateQueries({ queryKey: ['production-my-work'] })
      queryClient.invalidateQueries({ queryKey: ['deliverable-submission'] })
      router.push('/production/my-work')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit work')
    },
  })

  const isLoading = learnerLoading || deliverableLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!deliverable) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/production/my-work">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Work
          </Link>
        </Button>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold">Deliverable Not Found</h2>
            <p className="text-muted-foreground mt-2">
              This deliverable does not exist or is not assigned to you.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = deliverable.status as DeliverableStatus

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/production/my-work">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit Work</h1>
          <p className="text-muted-foreground">
            Upload your completed deliverable for review
          </p>
        </div>
      </div>

      {/* Deliverable Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{deliverable.title}</CardTitle>
              <CardDescription>
                Order #{deliverable.order_id?.slice(-8)}
              </CardDescription>
            </div>
            <Badge className={statusColors[status]}>
              {status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {deliverable.notes && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Notes</h4>
              <p className="text-sm text-muted-foreground">
                {deliverable.notes}
              </p>
            </div>
          )}

          {deliverable.order && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Order Type:</span>
                <span className="ml-2 font-medium">
                  {deliverable.order.order_type}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Division:</span>
                <span className="ml-2 font-medium">
                  {deliverable.order.division}
                </span>
              </div>
              {deliverable.order.due_date && (
                <div>
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(deliverable.order.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      {status === 'in_progress' || status === 'revision' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {status === 'revision' ? 'Resubmit Work' : 'Submit Work'}
            </CardTitle>
            <CardDescription>
              Provide the URL to your completed work (Google Drive, Dropbox, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'revision' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your previous submission requires revision. Please address the feedback and resubmit.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fileUrl">
                <LinkIcon className="h-4 w-4 inline mr-2" />
                File URL *
              </Label>
              <Input
                id="fileUrl"
                type="url"
                placeholder="https://drive.google.com/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload your file to Google Drive, Dropbox, or another cloud service and paste the share link here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileType">
                <FileText className="h-4 w-4 inline mr-2" />
                File Type
              </Label>
              <Input
                id="fileType"
                placeholder="e.g., video/mp4, image/png, application/pdf"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
              />
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!fileUrl || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              This deliverable cannot be submitted in its current status ({status}).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
