'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MetricCard, ScoreOverview } from './metric-card'
import { useNIRFMetrics, useNIRFReport } from '@/hooks/use-accreditation'
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Users,
  Star,
  Download,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

export function NIRFDashboard() {
  const { data: metrics, isLoading, error } = useNIRFMetrics()
  const { data: report, refetch: refreshReport } = useNIRFReport()

  const handleExport = () => {
    if (!report) return

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nirf-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-2" />
            <p>Failed to load NIRF metrics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">NIRF Metrics</h2>
          <p className="text-muted-foreground">
            National Institutional Ranking Framework assessment
          </p>
        </div>
        <Button onClick={handleExport} disabled={!report}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Score Overview */}
      <ScoreOverview
        title="NIRF Total Score"
        totalScore={metrics.totalScore}
        maxScore={metrics.maxTotalScore}
      />

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* RP - Research and Professional Practice */}
        <MetricCard
          title="RP - Research & Professional Practice"
          description="Publications, research projects, patents, consultancy"
          score={metrics.RP.score}
          maxScore={metrics.RP.maxScore}
          icon={<BookOpen className="h-5 w-5 text-blue-600" />}
          details={[
            { label: 'Total Publications', value: metrics.RP.totalPublications },
            { label: 'Scopus', value: metrics.RP.scopusPublications },
            { label: 'UGC-CARE', value: metrics.RP.ugcCarePublications },
            { label: 'Consultancy Projects', value: metrics.RP.consultancyProjects },
          ]}
        />

        {/* GO - Graduation Outcomes */}
        <MetricCard
          title="GO - Graduation Outcomes"
          description="Placement, higher studies, entrepreneurship"
          score={metrics.GO.score}
          maxScore={metrics.GO.maxScore}
          icon={<GraduationCap className="h-5 w-5 text-green-600" />}
          details={[
            { label: 'Placement Rate', value: `${metrics.GO.placementRate}%` },
            { label: 'Higher Studies', value: `${metrics.GO.higherStudies}%` },
            { label: 'Entrepreneurship', value: `${metrics.GO.entrepreneurship}%` },
          ]}
        />

        {/* OI - Outreach and Inclusivity */}
        <MetricCard
          title="OI - Outreach & Inclusivity"
          description="Regional diversity, women, economically disadvantaged"
          score={metrics.OI.score}
          maxScore={metrics.OI.maxScore}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          details={[
            { label: 'Regional Diversity', value: `${metrics.OI.regionalDiversity}%` },
            { label: 'Women Enrollment', value: `${metrics.OI.womenEnrollment}%` },
            { label: 'Economically Disadvantaged', value: `${metrics.OI.economicallyDisadvantaged}%` },
          ]}
        />

        {/* PR - Perception */}
        <MetricCard
          title="PR - Perception"
          description="Academic peers and employers"
          score={metrics.PR.score}
          maxScore={metrics.PR.maxScore}
          icon={<Star className="h-5 w-5 text-yellow-600" />}
          details={[
            { label: 'Academic Peers', value: `${metrics.PR.academicPeers}%` },
            { label: 'Employers', value: `${metrics.PR.employers}%` },
          ]}
        />
      </div>

      {/* Recommendations */}
      {report?.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Improvement Recommendations
            </CardTitle>
            <CardDescription>
              Action items to improve your NIRF ranking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
