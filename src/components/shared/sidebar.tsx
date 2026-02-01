'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Hammer,
  Video,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'

// Navigation items based on user roles
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['all'] },
  { name: 'Clients', href: '/clients', icon: Users, roles: ['md_caio', 'department_head', 'department_staff', 'jicate_staff'] },
  { name: 'Solutions', href: '/solutions', icon: Briefcase, roles: ['md_caio', 'department_head', 'department_staff', 'jicate_staff', 'builder', 'cohort_member', 'production_learner', 'client'] },
  { name: 'Software', href: '/software', icon: Hammer, roles: ['md_caio', 'jicate_staff', 'builder'] },
  { name: 'Training', href: '/training', icon: BookOpen, roles: ['md_caio', 'jicate_staff', 'cohort_member', 'department_head'] },
  { name: 'Content', href: '/content', icon: Video, roles: ['md_caio', 'jicate_staff', 'production_learner'] },
  { name: 'Departments', href: '/departments', icon: Building2, roles: ['md_caio', 'jicate_staff'] },
  { name: 'Talent', href: '/talent', icon: GraduationCap, roles: ['md_caio', 'department_head', 'jicate_staff'] },
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['md_caio', 'department_head', 'jicate_staff'] },
  { name: 'Publications', href: '/publications', icon: BookOpen, roles: ['md_caio', 'department_head', 'jicate_staff'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['md_caio', 'department_head', 'jicate_staff'] },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (item.roles.includes('all')) return true
    if (!user) return false
    return item.roles.includes(user.role)
  })

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-sidebar-foreground">
            JKKN Hub
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
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
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
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
