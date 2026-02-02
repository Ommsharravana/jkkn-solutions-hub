'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
} from 'lucide-react'
import type { PortalPayment } from '@/services/portal'
import { formatCurrency, getPaymentStatusLabel } from '@/services/portal'
import type { PaymentStatus } from '@/types/database'
import { format } from 'date-fns'

interface InvoiceTableProps {
  payments: PortalPayment[]
}

const statusConfig: Record<
  PaymentStatus,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  pending: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  invoiced: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  received: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  overdue: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
}

function getSolutionTitle(payment: PortalPayment): string {
  if (payment.phase) {
    const phase = Array.isArray(payment.phase) ? payment.phase[0] : payment.phase
    const solution = phase?.solution
    const sol = Array.isArray(solution) ? solution[0] : solution
    return sol?.title || 'Unknown Solution'
  }
  if (payment.program) {
    const program = Array.isArray(payment.program) ? payment.program[0] : payment.program
    const solution = program?.solution
    const sol = Array.isArray(solution) ? solution[0] : solution
    return sol?.title || 'Unknown Solution'
  }
  if (payment.order) {
    const order = Array.isArray(payment.order) ? payment.order[0] : payment.order
    const solution = order?.solution
    const sol = Array.isArray(solution) ? solution[0] : solution
    return sol?.title || 'Unknown Solution'
  }
  return 'Unknown'
}

function getPaymentTypeLabel(type: string | null): string {
  if (!type) return '-'
  const labels: Record<string, string> = {
    advance: 'Advance',
    milestone: 'Milestone',
    completion: 'Completion',
    amc: 'AMC',
    mou_signing: 'MoU Signing',
    deployment: 'Deployment',
    acceptance: 'Acceptance',
  }
  return labels[type] || type
}

export function InvoiceTable({ payments }: InvoiceTableProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No invoices found</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPaid = payments
    .filter((p) => p.status === 'received')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const totalOutstanding = payments
    .filter((p) => p.status !== 'received' && p.status !== 'failed')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalOutstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solution</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const config = statusConfig[payment.status as PaymentStatus]
              const StatusIcon = config?.icon || Clock

              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {getSolutionTitle(payment)}
                  </TableCell>
                  <TableCell>{getPaymentTypeLabel(payment.payment_type)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    {payment.due_date
                      ? format(new Date(payment.due_date), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {payment.paid_at
                      ? format(new Date(payment.paid_at), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${config?.bgColor || 'bg-gray-100'} ${config?.color || 'text-gray-600'}`}
                      variant="secondary"
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {getPaymentStatusLabel(payment.status as PaymentStatus)}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
