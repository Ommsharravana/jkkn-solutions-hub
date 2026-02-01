'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NAACDashboard } from '@/components/accreditation'
import { ArrowLeft } from 'lucide-react'

export default function NAACReportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NAAC Dashboard</h1>
          <p className="text-muted-foreground">
            National Assessment and Accreditation Council criteria and evaluation
          </p>
        </div>
      </div>

      {/* NAAC Dashboard Component */}
      <NAACDashboard />
    </div>
  )
}
