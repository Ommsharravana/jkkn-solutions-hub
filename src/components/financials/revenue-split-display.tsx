'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  calculateRevenueSplits,
  REVENUE_SPLIT_CONFIGS,
  type SplitType,
  type CalculatedSplit,
} from '@/services/revenue-splits'

interface RevenueSplitDisplayProps {
  splitType: SplitType
  amount?: number
  hodDiscount?: number
  isFirstPhase?: boolean
  hasReferral?: boolean
  showConfig?: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const splitTypeLabels: Record<SplitType, string> = {
  software: 'Software Solutions (40-40-20)',
  training_track_a: 'Training Track A - Community (60-20-20)',
  training_track_b: 'Training Track B - Corporate (30-20-30-20)',
  content: 'Content Production (60-20-20)',
}

const recipientColors: Record<string, string> = {
  jicate: 'bg-blue-500',
  department: 'bg-green-500',
  institution: 'bg-purple-500',
  cohort: 'bg-orange-500',
  council: 'bg-cyan-500',
  infrastructure: 'bg-gray-500',
  learners: 'bg-pink-500',
  referral_bonus: 'bg-yellow-500',
}

export function RevenueSplitDisplay({
  splitType,
  amount,
  hodDiscount = 0,
  isFirstPhase = false,
  hasReferral = false,
  showConfig = true,
}: RevenueSplitDisplayProps) {
  const config = REVENUE_SPLIT_CONFIGS[splitType]
  const hasAmount = amount !== undefined && amount > 0

  // Calculate actual splits if amount provided
  const result = hasAmount
    ? calculateRevenueSplits(amount, splitType, {
        hodDiscount,
        isFirstPhase,
        hasReferral,
      })
    : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Revenue Split</span>
          <Badge variant="outline">{splitTypeLabels[splitType]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showConfig && !hasAmount && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Standard split configuration:
            </p>
            {Object.entries(config).map(([key, percentage]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <Progress
                  value={percentage}
                  className="h-2"
                  indicatorClassName={recipientColors[key] || 'bg-primary'}
                />
              </div>
            ))}
          </div>
        )}

        {hasAmount && result && (
          <div className="space-y-4">
            <div className="text-center pb-2 border-b">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
            </div>

            {result.hodDiscountApplied > 0 && (
              <div className="flex justify-between text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <span>HOD Discount Applied</span>
                <span>-{formatCurrency(result.hodDiscountApplied)}</span>
              </div>
            )}

            {result.referralBonusApplied > 0 && (
              <div className="flex justify-between text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                <span>Referral Bonus (from dept share)</span>
                <span>{formatCurrency(result.referralBonusApplied)}</span>
              </div>
            )}

            <div className="space-y-3">
              {result.splits.map((split: CalculatedSplit) => (
                <div key={split.recipientType} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          recipientColors[split.recipientType] || 'bg-primary'
                        }`}
                      />
                      {split.recipientName}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(split.amount)}
                      <span className="text-muted-foreground ml-1">
                        ({split.percentage}%)
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={split.percentage}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for tables
export function RevenueSplitBadges({ splitType }: { splitType: SplitType }) {
  const config = REVENUE_SPLIT_CONFIGS[splitType]

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(config).map(([key, percentage]) => (
        <Badge key={key} variant="outline" className="text-xs">
          {key.charAt(0).toUpperCase() + key.slice(1)}: {percentage}%
        </Badge>
      ))}
    </div>
  )
}
