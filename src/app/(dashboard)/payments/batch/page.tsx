'use client'

import { BatchProcessor } from '@/components/financials'

export default function PaymentsBatchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monthly Payment Batch</h1>
        <p className="text-muted-foreground">
          Review and process monthly payments. Payments auto-process after 48 hours unless flagged.
        </p>
      </div>

      <BatchProcessor />
    </div>
  )
}
