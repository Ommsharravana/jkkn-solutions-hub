'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MouStatusBadge } from './mou-status-badge'
import { useCreateMou, useUpdateMou, useSendMou, useMarkMouSigned, useActivateMou } from '@/hooks/use-mous'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  FileText,
  DollarSign,
  Calendar,
  Send,
  CheckCircle,
  PlayCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import type { SolutionMou } from '@/types/database'
import { getDaysUntilExpiry, isExpiringSoon } from '@/services/mous'

interface MouFormProps {
  solutionId: string
  solutionTitle: string
  clientName?: string
  existingMou?: SolutionMou | null
  onSuccess?: () => void
}

function formatCurrency(amount: number | null): string {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function MouForm({
  solutionId,
  solutionTitle,
  clientName,
  existingMou,
  onSuccess,
}: MouFormProps) {
  const { user } = useAuth()
  const createMou = useCreateMou()
  const updateMou = useUpdateMou()
  const sendMouMutation = useSendMou()
  const markSignedMutation = useMarkMouSigned()
  const activateMutation = useActivateMou()

  const [dealValue, setDealValue] = useState(existingMou?.deal_value?.toString() || '')
  const [amcValue, setAmcValue] = useState(existingMou?.amc_value?.toString() || '')
  const [mouSigningPercent, setMouSigningPercent] = useState(
    existingMou?.payment_terms?.mou_signing?.toString() || '40'
  )
  const [deploymentPercent, setDeploymentPercent] = useState(
    existingMou?.payment_terms?.deployment?.toString() || '40'
  )
  const [acceptancePercent, setAcceptancePercent] = useState(
    existingMou?.payment_terms?.acceptance?.toString() || '20'
  )
  const [startDate, setStartDate] = useState(existingMou?.start_date?.split('T')[0] || '')
  const [expiryDate, setExpiryDate] = useState(existingMou?.expiry_date?.split('T')[0] || '')
  const [documentUrl, setDocumentUrl] = useState(existingMou?.mou_document_url || '')
  const [signedDate, setSignedDate] = useState('')

  const isEditing = !!existingMou
  const isPending =
    createMou.isPending ||
    updateMou.isPending ||
    sendMouMutation.isPending ||
    markSignedMutation.isPending ||
    activateMutation.isPending

  // Calculate total percentage
  const totalPercent =
    (parseInt(mouSigningPercent) || 0) +
    (parseInt(deploymentPercent) || 0) +
    (parseInt(acceptancePercent) || 0)

  // Expiry warning
  const daysUntilExpiry = existingMou ? getDaysUntilExpiry(existingMou.expiry_date) : null
  const showExpiryWarning = existingMou && isExpiringSoon(existingMou.expiry_date, 30)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dealValue || !user) {
      toast.error('Please enter deal value')
      return
    }

    if (totalPercent !== 100) {
      toast.error('Payment terms must add up to 100%')
      return
    }

    const paymentTerms = {
      mou_signing: parseInt(mouSigningPercent) || 0,
      deployment: parseInt(deploymentPercent) || 0,
      acceptance: parseInt(acceptancePercent) || 0,
    }

    try {
      if (isEditing && existingMou) {
        await updateMou.mutateAsync({
          id: existingMou.id,
          input: {
            deal_value: parseFloat(dealValue),
            amc_value: amcValue ? parseFloat(amcValue) : undefined,
            payment_terms: paymentTerms,
            start_date: startDate || undefined,
            expiry_date: expiryDate || undefined,
            mou_document_url: documentUrl || undefined,
          },
        })
        toast.success('MoU updated successfully')
      } else {
        await createMou.mutateAsync({
          solution_id: solutionId,
          deal_value: parseFloat(dealValue),
          amc_value: amcValue ? parseFloat(amcValue) : undefined,
          payment_terms: paymentTerms,
          start_date: startDate || undefined,
          expiry_date: expiryDate || undefined,
          mou_document_url: documentUrl || undefined,
          created_by: user.id,
        })
        toast.success('MoU created successfully')
      }
      onSuccess?.()
    } catch {
      toast.error(isEditing ? 'Failed to update MoU' : 'Failed to create MoU')
    }
  }

  const handleSend = async () => {
    if (!existingMou) return
    try {
      await sendMouMutation.mutateAsync(existingMou.id)
      toast.success('MoU marked as sent')
    } catch {
      toast.error('Failed to send MoU')
    }
  }

  const handleMarkSigned = async () => {
    if (!existingMou) return
    try {
      await markSignedMutation.mutateAsync({
        id: existingMou.id,
        signedDate: signedDate || undefined,
      })
      toast.success('MoU marked as signed')
      setSignedDate('')
    } catch {
      toast.error('Failed to mark MoU as signed')
    }
  }

  const handleActivate = async () => {
    if (!existingMou) return
    try {
      await activateMutation.mutateAsync({
        id: existingMou.id,
        startDate: startDate || undefined,
      })
      toast.success('MoU activated')
    } catch {
      toast.error('Failed to activate MoU')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with status */}
      {isEditing && existingMou && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {existingMou.mou_number}
                </CardTitle>
                <CardDescription>
                  {solutionTitle} {clientName && `- ${clientName}`}
                </CardDescription>
              </div>
              <MouStatusBadge status={existingMou.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {existingMou.sent_date && (
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-medium">
                    {format(new Date(existingMou.sent_date), 'PPP')}
                  </p>
                </div>
              )}
              {existingMou.signed_date && (
                <div>
                  <p className="text-muted-foreground">Signed</p>
                  <p className="font-medium">
                    {format(new Date(existingMou.signed_date), 'PPP')}
                  </p>
                </div>
              )}
              {existingMou.start_date && (
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(existingMou.start_date), 'PPP')}
                  </p>
                </div>
              )}
              {existingMou.expiry_date && (
                <div>
                  <p className="text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {format(new Date(existingMou.expiry_date), 'PPP')}
                  </p>
                </div>
              )}
            </div>

            {/* Expiry Warning */}
            {showExpiryWarning && daysUntilExpiry !== null && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  MoU expires in {daysUntilExpiry} days. Consider renewal.
                </span>
              </div>
            )}

            {/* Status Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {existingMou.status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSend}
                  disabled={isPending}
                >
                  {sendMouMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Mark as Sent
                </Button>
              )}

              {existingMou.status === 'sent' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={signedDate}
                    onChange={(e) => setSignedDate(e.target.value)}
                    className="w-40 h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSigned}
                    disabled={isPending}
                  >
                    {markSignedMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Mark as Signed
                  </Button>
                </div>
              )}

              {existingMou.status === 'signed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleActivate}
                  disabled={isPending}
                >
                  {activateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4 mr-2" />
                  )}
                  Activate MoU
                </Button>
              )}

              {existingMou.mou_document_url && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={existingMou.mou_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {isEditing ? 'Edit MoU Details' : 'Create New MoU'}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update the MoU information below'
                : 'Enter the MoU details for this solution'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deal Values */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deal_value">Deal Value (INR) *</Label>
                <Input
                  id="deal_value"
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  placeholder="e.g., 500000"
                  required
                />
                {dealValue && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(parseFloat(dealValue))}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amc_value">AMC Value (INR)</Label>
                <Input
                  id="amc_value"
                  type="number"
                  value={amcValue}
                  onChange={(e) => setAmcValue(e.target.value)}
                  placeholder="e.g., 50000"
                />
                {amcValue && (
                  <p className="text-xs text-muted-foreground">
                    Annual maintenance: {formatCurrency(parseFloat(amcValue))}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Terms */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Payment Terms</Label>
                <Badge
                  variant={totalPercent === 100 ? 'default' : 'destructive'}
                  className={totalPercent === 100 ? 'bg-green-100 text-green-800' : ''}
                >
                  Total: {totalPercent}%
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="mou_signing" className="text-sm text-muted-foreground">
                    MoU Signing (%)
                  </Label>
                  <Input
                    id="mou_signing"
                    type="number"
                    min="0"
                    max="100"
                    value={mouSigningPercent}
                    onChange={(e) => setMouSigningPercent(e.target.value)}
                  />
                  {dealValue && (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(
                        (parseFloat(dealValue) * (parseInt(mouSigningPercent) || 0)) / 100
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deployment" className="text-sm text-muted-foreground">
                    Deployment (%)
                  </Label>
                  <Input
                    id="deployment"
                    type="number"
                    min="0"
                    max="100"
                    value={deploymentPercent}
                    onChange={(e) => setDeploymentPercent(e.target.value)}
                  />
                  {dealValue && (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(
                        (parseFloat(dealValue) * (parseInt(deploymentPercent) || 0)) / 100
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acceptance" className="text-sm text-muted-foreground">
                    Acceptance (%)
                  </Label>
                  <Input
                    id="acceptance"
                    type="number"
                    min="0"
                    max="100"
                    value={acceptancePercent}
                    onChange={(e) => setAcceptancePercent(e.target.value)}
                  />
                  {dealValue && (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(
                        (parseFloat(dealValue) * (parseInt(acceptancePercent) || 0)) / 100
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Start Date
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Expiry Date
                </Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Document URL */}
            <div className="space-y-2">
              <Label htmlFor="document_url">MoU Document URL</Label>
              <Input
                id="document_url"
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Link to the signed MoU document (Google Drive, Dropbox, etc.)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isPending || totalPercent !== 100}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditing ? (
                  'Update MoU'
                ) : (
                  'Create MoU'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
