'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LEVEL_REQUIREMENTS } from '@/services/cohort-portal'

interface CohortHeaderProps {
  memberName: string
  level: number
}

function getLevelBadgeColor(level: number): string {
  const colors: Record<number, string> = {
    0: 'bg-gray-100 text-gray-800',
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-purple-100 text-purple-800',
  }
  return colors[level] || 'bg-gray-100 text-gray-800'
}

export function CohortHeader({ memberName, level }: CohortHeaderProps) {
  const levelInfo = LEVEL_REQUIREMENTS[level as keyof typeof LEVEL_REQUIREMENTS]

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h1 className="text-lg font-semibold">Cohort Member Portal</h1>
        <p className="text-sm text-muted-foreground">
          Self-service portal for training sessions
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Badge className={getLevelBadgeColor(level)}>
          {levelInfo?.title || 'Observer'}
        </Badge>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
