'use client'

import { PaymentForm } from '@/components/financials'

export default function NewPaymentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
        <p className="text-muted-foreground">
          Record a new payment for a solution phase, training program, or content order
        </p>
      </div>

      <PaymentForm />
    </div>
  )
}
