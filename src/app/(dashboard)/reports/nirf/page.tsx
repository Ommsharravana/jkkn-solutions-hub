'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NIRFDashboard } from '@/components/accreditation'
import { ArrowLeft } from 'lucide-react'

export default function NIRFReportPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">NIRF Dashboard</h1>
          <p className="text-muted-foreground">
            National Institutional Ranking Framework metrics and analysis
          </p>
        </div>
      </div>

      {/* NIRF Dashboard Component */}
      <NIRFDashboard />
    </div>
  )
}
