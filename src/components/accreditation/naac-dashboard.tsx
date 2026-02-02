'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MetricCard, ScoreOverview } from './metric-card'
import { useNAACCriteria, useNAACReport } from '@/hooks/use-accreditation'
import { exportNAACReport, downloadBlob } from '@/services/export'
import {
  BookOpen,
  Users,
  Lightbulb,
  Building2,
  Heart,
  Settings,
  Leaf,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export function NAACDashboard() {
  const { data: criteria, isLoading, error } = useNAACCriteria()
  const { data: report } = useNAACReport()
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(format)
      const blob = await exportNAACReport(format)
      const date = new Date().toISOString().split('T')[0]
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(blob, `NAAC-Report-JKKN-${date}.${extension}`)
      toast.success(`NAAC report exported as ${format.toUpperCase()}`)
    } catch (err) {
      console.error('Export failed:', err)
      toast.error(`Failed to export ${format.toUpperCase()} report`)
    } finally {
      setExporting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !criteria) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-2" />
            <p>Failed to load NAAC criteria</p>
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
          <h2 className="text-2xl font-bold tracking-tight">NAAC Criteria</h2>
          <p className="text-muted-foreground">
            National Assessment and Accreditation Council evaluation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exporting !== null}
          >
            {exporting === 'excel' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Export Excel
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      <ScoreOverview
        title="NAAC Assessment"
        totalScore={criteria.totalScore}
        maxScore={criteria.maxTotalScore}
        grade={criteria.grade}
        cgpa={criteria.cgpa}
      />

      {/* Criteria Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* C1 - Curricular Aspects */}
        <MetricCard
          title="C1 - Curricular Aspects"
          description="Curriculum design, enrichment, feedback"
          score={criteria.C1.score}
          maxScore={criteria.C1.maxScore}
          icon={<BookOpen className="h-5 w-5 text-blue-600" />}
          details={[
            { label: 'Design', value: criteria.C1.curriculumDesign },
            { label: 'Flexibility', value: criteria.C1.academicFlexibility },
            { label: 'Enrichment', value: criteria.C1.curriculumEnrichment },
            { label: 'Feedback', value: criteria.C1.feedback },
          ]}
        />

        {/* C2 - Teaching-Learning */}
        <MetricCard
          title="C2 - Teaching-Learning"
          description="Student enrollment, teacher profile"
          score={criteria.C2.score}
          maxScore={criteria.C2.maxScore}
          icon={<Users className="h-5 w-5 text-green-600" />}
          details={[
            { label: 'Enrollment', value: criteria.C2.studentEnrollment },
            { label: 'Teachers', value: criteria.C2.teacherProfile },
            { label: 'Learning', value: criteria.C2.learningProcess },
            { label: 'Evaluation', value: criteria.C2.evaluation },
          ]}
        />

        {/* C3 - Research, Innovations */}
        <MetricCard
          title="C3 - Research & Innovation"
          description="Research, consultancy, extension"
          score={criteria.C3.score}
          maxScore={criteria.C3.maxScore}
          icon={<Lightbulb className="h-5 w-5 text-yellow-600" />}
          details={[
            { label: 'Publications', value: criteria.C3.publications },
            { label: 'Consultancy', value: criteria.C3.consultancy },
            { label: 'Extension', value: criteria.C3.extension },
            { label: 'Collaboration', value: criteria.C3.collaboration },
          ]}
        />

        {/* C4 - Infrastructure */}
        <MetricCard
          title="C4 - Infrastructure"
          description="Physical and IT infrastructure"
          score={criteria.C4.score}
          maxScore={criteria.C4.maxScore}
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          details={[
            { label: 'Physical', value: criteria.C4.physicalInfrastructure },
            { label: 'IT', value: criteria.C4.itInfrastructure },
            { label: 'Library', value: criteria.C4.library },
          ]}
        />

        {/* C5 - Student Support */}
        <MetricCard
          title="C5 - Student Support"
          description="Scholarships, placements, alumni"
          score={criteria.C5.score}
          maxScore={criteria.C5.maxScore}
          icon={<Heart className="h-5 w-5 text-red-600" />}
          details={[
            { label: 'Scholarships', value: criteria.C5.scholarships },
            { label: 'Placements', value: criteria.C5.placements },
            { label: 'Alumni', value: criteria.C5.alumni },
          ]}
        />

        {/* C6 - Governance */}
        <MetricCard
          title="C6 - Governance"
          description="Vision, strategy, quality assurance"
          score={criteria.C6.score}
          maxScore={criteria.C6.maxScore}
          icon={<Settings className="h-5 w-5 text-gray-600" />}
          details={[
            { label: 'Vision', value: criteria.C6.vision },
            { label: 'Strategy', value: criteria.C6.strategy },
            { label: 'Quality', value: criteria.C6.qualityAssurance },
          ]}
        />

        {/* C7 - Values & Best Practices */}
        <MetricCard
          title="C7 - Values & Best Practices"
          description="Gender, environment, innovation"
          score={criteria.C7.score}
          maxScore={criteria.C7.maxScore}
          icon={<Leaf className="h-5 w-5 text-green-600" />}
          details={[
            { label: 'Gender', value: criteria.C7.gender },
            { label: 'Environment', value: criteria.C7.environment },
            { label: 'Innovation', value: criteria.C7.innovation },
            { label: 'Best Practices', value: criteria.C7.bestPractices },
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
              Action items to improve your NAAC grade
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
