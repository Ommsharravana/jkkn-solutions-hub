'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreatePayment, useUpdatePayment } from '@/hooks/use-payments'
import { useAuth } from '@/hooks/use-auth'
import { useSolutions } from '@/hooks/use-solutions'
import { RevenueSplitDisplay } from './revenue-split-display'
import { getSplitType, type SplitType } from '@/services/revenue-splits'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Payment, PaymentType, PaymentStatus } from '@/types/database'

const paymentSchema = z.object({
  source_type: z.enum(['phase', 'program', 'order']),
  source_id: z.string().min(1, 'Source is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  payment_type: z.enum(['advance', 'milestone', 'completion', 'amc', 'mou_signing', 'deployment', 'acceptance']),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  due_date: z.string().optional(),
  paid_at: z.string().optional(),
  status: z.enum(['pending', 'invoiced', 'received', 'overdue', 'failed']),
  notes: z.string().optional(),
  calculate_splits: z.boolean().default(true),
  hod_discount: z.number().min(0).max(10).optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  payment?: Payment
  defaultSourceType?: 'phase' | 'program' | 'order'
  defaultSourceId?: string
  onSuccess?: () => void
}

export function PaymentForm({
  payment,
  defaultSourceType,
  defaultSourceId,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { data: solutions } = useSolutions()
  const createPayment = useCreatePayment()
  const updatePayment = useUpdatePayment()
  const [splitType, setSplitType] = useState<SplitType>('software')

  const isEditing = !!payment

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema) as never,
    defaultValues: {
      source_type: defaultSourceType || (payment?.phase_id ? 'phase' : payment?.program_id ? 'program' : 'order'),
      source_id: defaultSourceId || payment?.phase_id || payment?.program_id || payment?.order_id || '',
      amount: payment?.amount || 0,
      payment_type: payment?.payment_type || 'milestone',
      payment_method: payment?.payment_method || '',
      reference_number: payment?.reference_number || '',
      due_date: payment?.due_date?.split('T')[0] || '',
      paid_at: payment?.paid_at?.split('T')[0] || '',
      status: payment?.status || 'pending',
      notes: payment?.notes || '',
      calculate_splits: true,
      hod_discount: 0,
    },
  })

  const sourceType = form.watch('source_type')
  const amount = form.watch('amount')
  const status = form.watch('status')
  const hodDiscount = form.watch('hod_discount')
  const calculateSplits = form.watch('calculate_splits')

  // Update split type based on source selection
  useEffect(() => {
    if (sourceType === 'phase') {
      setSplitType('software')
    } else if (sourceType === 'program') {
      // Would need to fetch program to get track
      setSplitType('training_track_a')
    } else if (sourceType === 'order') {
      setSplitType('content')
    }
  }, [sourceType])

  async function onSubmit(data: PaymentFormValues) {
    if (!user) return

    try {
      if (isEditing) {
        await updatePayment.mutateAsync({
          id: payment.id,
          input: {
            amount: data.amount,
            payment_type: data.payment_type as PaymentType,
            payment_method: data.payment_method,
            reference_number: data.reference_number,
            due_date: data.due_date || undefined,
            paid_at: data.paid_at || undefined,
            status: data.status as PaymentStatus,
            notes: data.notes,
          },
        })
        toast.success('Payment updated successfully')
      } else {
        await createPayment.mutateAsync({
          phase_id: data.source_type === 'phase' ? data.source_id : undefined,
          program_id: data.source_type === 'program' ? data.source_id : undefined,
          order_id: data.source_type === 'order' ? data.source_id : undefined,
          amount: data.amount,
          payment_type: data.payment_type as PaymentType,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          due_date: data.due_date || undefined,
          paid_at: data.paid_at || undefined,
          status: data.status as PaymentStatus,
          notes: data.notes,
          recorded_by: user.id,
          calculate_splits: data.calculate_splits,
          hod_discount: data.hod_discount,
        })
        toast.success('Payment recorded successfully')
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/payments')
      }
    } catch (error) {
      toast.error(isEditing ? 'Failed to update payment' : 'Failed to record payment')
      console.error(error)
    }
  }

  const isLoading = createPayment.isPending || updatePayment.isPending

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditing && (
                  <>
                    <FormField
                      control={form.control}
                      name="source_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment For</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="phase">Software Phase</SelectItem>
                              <SelectItem value="program">Training Program</SelectItem>
                              <SelectItem value="order">Content Order</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="source_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {sourceType === 'phase' && 'Select Phase'}
                            {sourceType === 'program' && 'Select Program'}
                            {sourceType === 'order' && 'Select Order'}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter ID (will be replaced with dropdown)" />
                          </FormControl>
                          <FormDescription>
                            Enter the ID of the {sourceType} this payment is for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (INR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="advance">Advance</SelectItem>
                            <SelectItem value="milestone">Milestone</SelectItem>
                            <SelectItem value="completion">Completion</SelectItem>
                            <SelectItem value="mou_signing">MoU Signing (40%)</SelectItem>
                            <SelectItem value="deployment">Deployment (40%)</SelectItem>
                            <SelectItem value="acceptance">Acceptance (20%)</SelectItem>
                            <SelectItem value="amc">AMC</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="invoiced">Invoiced</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Bank Transfer, UPI, Cheque" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {status === 'received' && (
                    <FormField
                      control={form.control}
                      name="paid_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paid Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Transaction ID, Cheque No., etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {!isEditing && status === 'received' && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Split Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="calculate_splits"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Calculate Revenue Splits</FormLabel>
                          <FormDescription>
                            Automatically calculate and record earnings distribution
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {calculateSplits && sourceType === 'phase' && (
                    <FormField
                      control={form.control}
                      name="hod_discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HOD Discount (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Up to 10% discount deducted from department share
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Payment' : 'Record Payment'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div>
        {amount > 0 && calculateSplits && (
          <RevenueSplitDisplay
            splitType={splitType}
            amount={amount}
            hodDiscount={hodDiscount}
            isFirstPhase={false}
            hasReferral={false}
          />
        )}
      </div>
    </div>
  )
}
