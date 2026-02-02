'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ListTodo,
  FileStack,
  DollarSign,
  Upload,
} from 'lucide-react'

const navItems = [
  { href: '/production', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/production/queue', icon: ListTodo, label: 'Available Work' },
  { href: '/production/my-work', icon: FileStack, label: 'My Work' },
  { href: '/production/earnings', icon: DollarSign, label: 'Earnings' },
]

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Production Portal</h1>
          <p className="text-sm text-muted-foreground">Content Creation Hub</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/production' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 rounded-lg border bg-background p-4">
          <h3 className="font-medium">Need Help?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Contact the production council for support.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
