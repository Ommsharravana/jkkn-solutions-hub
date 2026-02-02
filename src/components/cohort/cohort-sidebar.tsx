'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Calendar,
  CalendarCheck,
  Wallet,
  Award,
  LogOut,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { LEVEL_REQUIREMENTS } from '@/services/cohort-portal'

interface CohortSidebarProps {
  memberName: string
  memberId: string
  level: number
}

const navigation = [
  { name: 'Portal Home', href: '/cohort', icon: Home },
  { name: 'Available Sessions', href: '/cohort/sessions', icon: Calendar },
  { name: 'My Schedule', href: '/cohort/schedule', icon: CalendarCheck },
  { name: 'My Earnings', href: '/cohort/earnings', icon: Wallet },
  { name: 'Level Progress', href: '/cohort/level', icon: Award },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: 'bg-gray-500',
    1: 'bg-blue-500',
    2: 'bg-green-500',
    3: 'bg-purple-500',
  }
  return colors[level] || 'bg-gray-500'
}

export function CohortSidebar({ memberName, memberId, level }: CohortSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const levelInfo = LEVEL_REQUIREMENTS[level as keyof typeof LEVEL_REQUIREMENTS]

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-100 text-green-700">
            {getInitials(memberName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {memberName}
          </p>
          <Badge className={cn('text-xs', getLevelColor(level))}>
            Level {level}: {levelInfo?.title}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/cohort' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4">
        <Separator className="mb-4" />

        {/* Back to Main Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <ArrowLeft className="h-5 w-5" />
          Main Dashboard
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
