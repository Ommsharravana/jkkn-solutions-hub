'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  description?: string
  score: number
  maxScore: number
  icon?: React.ReactNode
  details?: Array<{ label: string; value: string | number }>
  className?: string
}

export function MetricCard({
  title,
  description,
  score,
  maxScore,
  icon,
  details,
  className,
}: MetricCardProps) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

  const getProgressColor = (pct: number) => {
    if (pct >= 75) return 'bg-green-500'
    if (pct >= 50) return 'bg-yellow-500'
    if (pct >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-xs text-muted-foreground">/ {maxScore}</div>
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getProgressColor(percentage))}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            {details.map((detail, index) => (
              <div key={index} className="text-sm">
                <div className="text-muted-foreground">{detail.label}</div>
                <div className="font-medium">{detail.value}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ScoreOverviewProps {
  title: string
  totalScore: number
  maxScore: number
  grade?: string
  cgpa?: number
  className?: string
}

export function ScoreOverview({
  title,
  totalScore,
  maxScore,
  grade,
  cgpa,
  className,
}: ScoreOverviewProps) {
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

  const getGradeColor = (g: string) => {
    if (g.startsWith('A')) return 'text-green-600 bg-green-50'
    if (g.startsWith('B')) return 'text-blue-600 bg-blue-50'
    if (g.startsWith('C')) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Overall assessment score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold">{totalScore}</div>
            <div className="text-muted-foreground">out of {maxScore}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {percentage.toFixed(1)}% achieved
            </div>
          </div>
          {grade && (
            <div className="text-center">
              <div
                className={cn(
                  'text-4xl font-bold px-6 py-3 rounded-lg',
                  getGradeColor(grade)
                )}
              >
                {grade}
              </div>
              {cgpa !== undefined && (
                <div className="text-sm text-muted-foreground mt-2">
                  CGPA: {cgpa.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
