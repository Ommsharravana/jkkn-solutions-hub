import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BuilderSidebar } from './builder-sidebar'
import { BuilderHeader } from './builder-header'

export default async function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is a builder
  const { data: builder } = await supabase
    .from('builders')
    .select(`
      *,
      department:departments(id, name, code)
    `)
    .eq('user_id', user.id)
    .single()

  if (!builder) {
    // Not a builder - redirect to main dashboard
    redirect('/')
  }

  return (
    <div className="flex h-screen">
      <BuilderSidebar builderName={builder.name} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BuilderHeader builderName={builder.name} departmentName={builder.department?.name} />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
