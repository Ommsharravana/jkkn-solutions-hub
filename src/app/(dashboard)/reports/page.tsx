'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePublicationStats } from '@/hooks/use-publications'
import { useNIRFMetrics, useNAACCriteria } from '@/hooks/use-accreditation'
import {
  FileText,
  Award,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsPage() {
  const { data: pubStats, isLoading: pubLoading } = usePublicationStats()
  const { data: nirfMetrics, isLoading: nirfLoading } = useNIRFMetrics()
  const { data: naacCriteria, isLoading: naacLoading } = useNAACCriteria()

  const isLoading = pubLoading || nirfLoading || naacLoading

  // Calculate days until accreditation visit (3 months from now as per spec)
  const visitDate = new Date()
  visitDate.setMonth(visitDate.getMonth() + 3)
  const daysUntilVisit = Math.ceil((visitDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accreditation Reports</h1>
          <p className="text-muted-foreground">
            Track NIRF and NAAC metrics for upcoming accreditation visit
          </p>
        </div>
      </div>

      {/* Urgent Alert */}
      <Card className="border-orange-500 bg-orange-50">
        <CardContent className="flex items-center gap-4 py-4">
          <AlertTriangle className="h-8 w-8 text-orange-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-700">Accreditation Visit Approaching</h3>
            <p className="text-sm text-orange-600">
              Approximately {daysUntilVisit} days until the accreditation visit. Ensure all metrics are updated.
            </p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-500">
            <Calendar className="h-3 w-3 mr-1" />
            {visitDate.toLocaleDateString()}
          </Badge>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pubStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {pubStats?.publishedCount || 0} published, {pubStats?.inProgressCount || 0} in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scopus Papers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pubStats?.byJournalType?.scopus || 0}</div>
                <p className="text-xs text-muted-foreground">High-impact journals</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NIRF Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {nirfMetrics?.totalScore || 0}/{nirfMetrics?.maxTotalScore || 400}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nirfMetrics ? ((nirfMetrics.totalScore / nirfMetrics.maxTotalScore) * 100).toFixed(1) : 0}% achieved
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NAAC Grade</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{naacCriteria?.grade || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  CGPA: {naacCriteria?.cgpa?.toFixed(2) || '0.00'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* NIRF Report */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>NIRF Report</CardTitle>
                <CardDescription>
                  National Institutional Ranking Framework
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground">
              Track Research & Professional Practice (RP), Graduation Outcomes (GO),
              Outreach & Inclusivity (OI), and Perception (PR) metrics.
            </p>
            {!isLoading && nirfMetrics && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RP Score:</span>
                  <span className="font-medium">{nirfMetrics.RP.score}/{nirfMetrics.RP.maxScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GO Score:</span>
                  <span className="font-medium">{nirfMetrics.GO.score}/{nirfMetrics.GO.maxScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OI Score:</span>
                  <span className="font-medium">{nirfMetrics.OI.score}/{nirfMetrics.OI.maxScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PR Score:</span>
                  <span className="font-medium">{nirfMetrics.PR.score}/{nirfMetrics.PR.maxScore}</span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href="/reports/nirf">
                View NIRF Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* NAAC Report */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>NAAC Report</CardTitle>
                <CardDescription>
                  National Assessment and Accreditation Council
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground">
              Evaluate performance across 7 criteria covering curriculum, teaching,
              research, infrastructure, and governance.
            </p>
            {!isLoading && naacCriteria && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Score:</span>
                  <span className="font-medium">{naacCriteria.totalScore}/{naacCriteria.maxTotalScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGPA:</span>
                  <span className="font-medium">{naacCriteria.cgpa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade:</span>
                  <span className="font-medium">{naacCriteria.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">C3 (Research):</span>
                  <span className="font-medium">{naacCriteria.C3.score}/{naacCriteria.C3.maxScore}</span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href="/reports/naac">
                View NAAC Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Publications Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Publications</CardTitle>
                <CardDescription>
                  Research publications linked to solutions
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/publications">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : pubStats ? (
            <div className="grid gap-4 md:grid-cols-5">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{pubStats.byPaperType.problem}</div>
                <div className="text-xs text-muted-foreground">Problem</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{pubStats.byPaperType.design}</div>
                <div className="text-xs text-muted-foreground">Design</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{pubStats.byPaperType.technical}</div>
                <div className="text-xs text-muted-foreground">Technical</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{pubStats.byPaperType.data}</div>
                <div className="text-xs text-muted-foreground">Data</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{pubStats.byPaperType.impact}</div>
                <div className="text-xs text-muted-foreground">Impact</div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No publications data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
