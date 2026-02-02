import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalNav } from '@/components/portal/portal-nav'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Server-side auth check
  if (!user) {
    redirect('/auth/login?redirect=/portal')
  }

  // Fetch user profile to verify they're a client
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If user is internal staff, redirect to main dashboard
  if (profile?.user_type === 'internal' && profile?.role !== 'client') {
    redirect('/')
  }

  return (
    <div className="flex h-screen">
      <PortalNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h1 className="text-lg font-semibold">JKKN Solutions - Client Portal</h1>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">{children}</main>
      </div>
    </div>
  )
}
