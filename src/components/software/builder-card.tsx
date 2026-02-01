'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BuilderSkills } from './builder-skills'
import { Calendar, Building2, Briefcase, Mail } from 'lucide-react'
import type { BuilderWithDetails } from '@/services/builders'
import { formatDistanceToNow, format } from 'date-fns'

interface BuilderCardProps {
  builder: BuilderWithDetails
  showAssignments?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function BuilderCard({ builder, showAssignments = false }: BuilderCardProps) {
  const activeAssignments = builder.assignments?.filter(
    (a) => a.status === 'active' || a.status === 'approved'
  )

  return (
    <Link href={`/software/builders/${builder.id}`}>
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-muted-foreground/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(builder.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{builder.name}</CardTitle>
                {builder.email && (
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Mail className="h-3 w-3" />
                    {builder.email}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge
              variant={builder.is_active ? 'default' : 'secondary'}
              className={builder.is_active ? 'bg-green-100 text-green-800' : ''}
            >
              {builder.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Skills */}
          {builder.skills && builder.skills.length > 0 && (
            <BuilderSkills skills={builder.skills} maxDisplay={4} />
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {builder.department && (
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{builder.department.name}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Trained {format(new Date(builder.trained_date), 'MMM yyyy')}</span>
            </div>

            {showAssignments && activeAssignments && activeAssignments.length > 0 && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span>{activeAssignments.length} active</span>
              </div>
            )}
          </div>

          {/* Current assignments preview */}
          {showAssignments && activeAssignments && activeAssignments.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Current Assignments:
              </p>
              <div className="space-y-1">
                {activeAssignments.slice(0, 2).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="text-xs text-muted-foreground flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {assignment.phase?.solution?.solution_code} - Phase{' '}
                    {assignment.phase?.phase_number}
                  </div>
                ))}
                {activeAssignments.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{activeAssignments.length - 2} more
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Added {formatDistanceToNow(new Date(builder.created_at), { addSuffix: true })}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
