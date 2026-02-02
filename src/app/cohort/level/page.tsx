'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Award,
  Eye,
  Users,
  UserCheck,
  Crown,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLevelProgress, useRequestLevelUp, useCohortMemberById } from '@/hooks/use-cohort-portal'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { LEVEL_REQUIREMENTS } from '@/services/cohort-portal'

function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: 'bg-gray-100 text-gray-800 border-gray-300',
    1: 'bg-blue-100 text-blue-800 border-blue-300',
    2: 'bg-green-100 text-green-800 border-green-300',
    3: 'bg-purple-100 text-purple-800 border-purple-300',
  }
  return colors[level] || 'bg-gray-100 text-gray-800 border-gray-300'
}

function getLevelIcon(level: number) {
  switch (level) {
    case 0:
      return <Eye className="h-8 w-8" />
    case 1:
      return <Users className="h-8 w-8" />
    case 2:
      return <UserCheck className="h-8 w-8" />
    case 3:
      return <Crown className="h-8 w-8" />
    default:
      return <Award className="h-8 w-8" />
  }
}

const LEVEL_DETAILS = [
  {
    level: 0,
    title: 'Observer',
    description: 'New member starting their journey. Observe sessions to learn the training methodology.',
    can_claim: ['Observer', 'Support'],
    next_requirement: 'Complete 3 observer sessions to qualify for Level 1',
    benefits: ['Access to all training materials', 'Observe any session', 'Build foundational knowledge'],
  },
  {
    level: 1,
    title: 'Co-Lead',
    description: 'Experienced observer ready to take on more responsibility. Lead sessions with supervision.',
    can_claim: ['Observer', 'Support', 'Co-Lead'],
    next_requirement: 'Complete 5 co-lead sessions to qualify for Level 2',
    benefits: ['All Level 0 benefits', 'Co-lead sessions with a mentor', 'Start earning from sessions'],
  },
  {
    level: 2,
    title: 'Lead',
    description: 'Certified trainer who can lead standard sessions independently.',
    can_claim: ['Observer', 'Support', 'Co-Lead', 'Lead'],
    next_requirement: 'Complete 10 lead sessions to qualify for Level 3',
    benefits: ['All Level 1 benefits', 'Lead sessions independently', 'Higher earning rate'],
  },
  {
    level: 3,
    title: 'Master Trainer',
    description: 'Expert trainer who can lead any session and mentor others.',
    can_claim: ['Observer', 'Support', 'Co-Lead', 'Lead'],
    next_requirement: 'Maximum level achieved',
    benefits: ['All Level 2 benefits', 'Mentor new cohort members', 'Highest earning rate', 'Priority for premium sessions'],
  },
]

export default function LevelProgressPage() {
  const { user } = useAuth()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [showLevelUpDialog, setShowLevelUpDialog] = useState(false)

  // Get cohort member ID from user
  useEffect(() => {
    async function fetchMember() {
      if (!user?.id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('cohort_members')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setMemberId(data.id)
      }
    }
    fetchMember()
  }, [user?.id])

  const { data: progress, isLoading, refetch } = useLevelProgress(memberId || '')
  const { data: member } = useCohortMemberById(memberId || '')
  const levelUpMutation = useRequestLevelUp()

  const handleLevelUp = async () => {
    if (!memberId) return

    try {
      const result = await levelUpMutation.mutateAsync(memberId)
      toast.success(result.message)
      setShowLevelUpDialog(false)
      refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request level up')
    }
  }

  if (isLoading || !memberId) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const currentLevelDetails = LEVEL_DETAILS.find((l) => l.level === progress?.current_level) || LEVEL_DETAILS[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Level Progress</h1>
        <p className="text-muted-foreground">
          Track your progression through the cohort levels and unlock new capabilities.
        </p>
      </div>

      {/* Current Level Card */}
      <Card className={`border-2 ${getLevelColor(progress?.current_level || 0)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${getLevelColor(progress?.current_level || 0)}`}>
                {getLevelIcon(progress?.current_level || 0)}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Level {progress?.current_level}: {progress?.level_title}
                </CardTitle>
                <CardDescription className="text-base">
                  {currentLevelDetails.description}
                </CardDescription>
              </div>
            </div>
            {progress?.requirements_for_next_level?.can_apply && (
              <Button onClick={() => setShowLevelUpDialog(true)}>
                <Award className="h-4 w-4 mr-2" />
                Request Level Up
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Eye className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="text-2xl font-bold mt-2">{progress?.sessions_observed || 0}</div>
              <div className="text-sm text-muted-foreground">Sessions Observed</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Users className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="text-2xl font-bold mt-2">{progress?.sessions_co_led || 0}</div>
              <div className="text-sm text-muted-foreground">Sessions Co-Led</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <UserCheck className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="text-2xl font-bold mt-2">{progress?.sessions_led || 0}</div>
              <div className="text-sm text-muted-foreground">Sessions Led</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Level */}
      {progress?.requirements_for_next_level && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Progress to Level {(progress?.current_level || 0) + 1}
            </CardTitle>
            <CardDescription>
              {progress.requirements_for_next_level.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sessions Completed</span>
                <span className="font-medium">
                  {progress.requirements_for_next_level.current_sessions} / {progress.requirements_for_next_level.sessions_needed}
                </span>
              </div>
              <Progress
                value={
                  (progress.requirements_for_next_level.current_sessions /
                    progress.requirements_for_next_level.sessions_needed) *
                  100
                }
                className="h-3"
              />
            </div>

            {progress.requirements_for_next_level.can_apply ? (
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-semibold">You&apos;re eligible for Level {(progress?.current_level || 0) + 1}!</p>
                  <p className="text-sm">Click the button above to request your promotion.</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Complete {progress.requirements_for_next_level.sessions_needed - progress.requirements_for_next_level.current_sessions} more
                sessions to become eligible for the next level.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Levels Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Level Overview</CardTitle>
          <CardDescription>
            Understand what each level unlocks and how to progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {LEVEL_DETAILS.map((level) => {
              const isCurrentLevel = level.level === progress?.current_level
              const isUnlocked = level.level <= (progress?.current_level || 0)

              return (
                <Card
                  key={level.level}
                  className={`${isCurrentLevel ? 'ring-2 ring-primary' : ''} ${!isUnlocked ? 'opacity-60' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(level.level)}>
                          Level {level.level}
                        </Badge>
                        <span className="font-semibold">{level.title}</span>
                      </div>
                      {isCurrentLevel && (
                        <Badge variant="outline" className="bg-primary/10">
                          Current
                        </Badge>
                      )}
                      {isUnlocked && !isCurrentLevel && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{level.description}</p>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">CAN CLAIM:</p>
                      <div className="flex flex-wrap gap-1">
                        {level.can_claim.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">BENEFITS:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {level.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Level Up Confirmation Dialog */}
      <AlertDialog open={showLevelUpDialog} onOpenChange={setShowLevelUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Level Up?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve met the requirements for Level {(progress?.current_level || 0) + 1}!
              <span className="block mt-2">
                Once approved, you&apos;ll unlock new roles and benefits. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLevelUp} disabled={levelUpMutation.isPending}>
              {levelUpMutation.isPending ? 'Processing...' : 'Confirm Level Up'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
