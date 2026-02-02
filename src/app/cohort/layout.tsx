import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CohortSidebar } from '@/components/cohort/cohort-sidebar'
import { CohortHeader } from '@/components/cohort/cohort-header'

export default async function CohortPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is a cohort member
  const { data: cohortMember } = await supabase
    .from('cohort_members')
    .select('id, name, level, status')
    .eq('user_id', user.id)
    .single()

  if (!cohortMember) {
    // User is not a cohort member, redirect to main dashboard
    redirect('/')
  }

  if (cohortMember.status !== 'active') {
    // Inactive cohort members can't access the portal
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-background">
      <CohortSidebar
        memberName={cohortMember.name}
        memberId={cohortMember.id}
        level={cohortMember.level}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <CohortHeader
          memberName={cohortMember.name}
          level={cohortMember.level}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
