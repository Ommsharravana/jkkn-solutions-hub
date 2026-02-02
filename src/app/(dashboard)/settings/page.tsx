'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  Info,
  Building2,
  IndianRupee,
  ExternalLink,
  Save,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { REVENUE_SPLIT_CONFIGS } from '@/services/revenue-splits'

// ============================================
// CONSTANTS
// ============================================

const APP_VERSION = '1.0.0'
const SUPPORT_EMAIL = 'support@jkkn.ac.in'
const DOCS_URL = 'https://docs.solutions.jkkn.ai'

const ASSIGNMENT_THRESHOLDS = {
  software: {
    selfClaim: 300000, // 3 Lakh
    description: 'Up to Rs.3 Lakh: Self-claim/HOD | Above Rs.3 Lakh: MD approval',
  },
  training: {
    selfClaim: 200000, // 2 Lakh
    description: 'Up to Rs.2 Lakh: Self-claim/HOD | Above Rs.2 Lakh: MD approval',
  },
  content: {
    selfClaim: 50000, // 50K
    description: 'Up to Rs.50K: Self-claim/HOD | Above Rs.50K: MD approval',
  },
}

const PARTNER_DISCOUNT = {
  rate: 50,
  types: ['yi', 'alumni', 'mou', 'referral'],
}

// ============================================
// PROFILE SECTION COMPONENT
// ============================================

interface ProfileSectionProps {
  user: any
  loading?: boolean
}

function ProfileSection({ user, loading }: ProfileSectionProps) {
  const [phone, setPhone] = useState(user?.phone || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real implementation, this would save to the database
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>
          Manage your personal information and display preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar and Name */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
            <AvatarFallback className="text-xl">
              {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{user?.fullName || 'User'}</h3>
            <Badge variant="outline" className="mt-1 capitalize">
              {user?.role?.replace('_', ' ') || 'User'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Read-only fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address
            </Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saved}>
            {saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// NOTIFICATIONS SECTION COMPONENT
// ============================================

function NotificationsSection() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [assignmentAlerts, setAssignmentAlerts] = useState(true)
  const [paymentNotifications, setPaymentNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email updates about your account activity
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="assignment-alerts">Assignment Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when assigned to new projects or tasks
            </p>
          </div>
          <Switch
            id="assignment-alerts"
            checked={assignmentAlerts}
            onCheckedChange={setAssignmentAlerts}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="payment-notifications">Payment Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive alerts for payments and earnings updates
            </p>
          </div>
          <Switch
            id="payment-notifications"
            checked={paymentNotifications}
            onCheckedChange={setPaymentNotifications}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weekly-digest">Weekly Digest</Label>
            <p className="text-sm text-muted-foreground">
              Receive a weekly summary of your activity
            </p>
          </div>
          <Switch
            id="weekly-digest"
            checked={weeklyDigest}
            onCheckedChange={setWeeklyDigest}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// SYSTEM SETTINGS SECTION (MD ONLY)
// ============================================

function SystemSettingsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Platform-wide configuration and business rules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Split Defaults */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Revenue Split Models
          </h4>
          <div className="space-y-3">
            {/* Software */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Software</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded dark:bg-blue-900/20">
                  <div className="font-semibold text-blue-600">{REVENUE_SPLIT_CONFIGS.software.jicate}%</div>
                  <div className="text-xs text-muted-foreground">JICATE</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded dark:bg-green-900/20">
                  <div className="font-semibold text-green-600">{REVENUE_SPLIT_CONFIGS.software.department}%</div>
                  <div className="text-xs text-muted-foreground">Department</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded dark:bg-purple-900/20">
                  <div className="font-semibold text-purple-600">{REVENUE_SPLIT_CONFIGS.software.institution}%</div>
                  <div className="text-xs text-muted-foreground">Institution</div>
                </div>
              </div>
            </div>

            {/* Training Track A */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Training (Track A)</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-green-50 rounded dark:bg-green-900/20">
                  <div className="font-semibold text-green-600">{REVENUE_SPLIT_CONFIGS.training_track_a.cohort}%</div>
                  <div className="text-xs text-muted-foreground">Cohort</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded dark:bg-amber-900/20">
                  <div className="font-semibold text-amber-600">{REVENUE_SPLIT_CONFIGS.training_track_a.council}%</div>
                  <div className="text-xs text-muted-foreground">Council</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded dark:bg-gray-800">
                  <div className="font-semibold text-gray-600 dark:text-gray-300">{REVENUE_SPLIT_CONFIGS.training_track_a.infrastructure}%</div>
                  <div className="text-xs text-muted-foreground">Infrastructure</div>
                </div>
              </div>
            </div>

            {/* Training Track B */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Training (Track B)</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="text-center p-2 bg-green-50 rounded dark:bg-green-900/20">
                  <div className="font-semibold text-green-600">{REVENUE_SPLIT_CONFIGS.training_track_b.cohort}%</div>
                  <div className="text-xs text-muted-foreground">Cohort</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded dark:bg-blue-900/20">
                  <div className="font-semibold text-blue-600">{REVENUE_SPLIT_CONFIGS.training_track_b.department}%</div>
                  <div className="text-xs text-muted-foreground">Dept</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded dark:bg-amber-900/20">
                  <div className="font-semibold text-amber-600">{REVENUE_SPLIT_CONFIGS.training_track_b.jicate}%</div>
                  <div className="text-xs text-muted-foreground">JICATE</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded dark:bg-purple-900/20">
                  <div className="font-semibold text-purple-600">{REVENUE_SPLIT_CONFIGS.training_track_b.institution}%</div>
                  <div className="text-xs text-muted-foreground">Institution</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Content</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-purple-50 rounded dark:bg-purple-900/20">
                  <div className="font-semibold text-purple-600">{REVENUE_SPLIT_CONFIGS.content.learners}%</div>
                  <div className="text-xs text-muted-foreground">Learners</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded dark:bg-amber-900/20">
                  <div className="font-semibold text-amber-600">{REVENUE_SPLIT_CONFIGS.content.council}%</div>
                  <div className="text-xs text-muted-foreground">Council</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded dark:bg-gray-800">
                  <div className="font-semibold text-gray-600 dark:text-gray-300">{REVENUE_SPLIT_CONFIGS.content.infrastructure}%</div>
                  <div className="text-xs text-muted-foreground">Infrastructure</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Assignment Thresholds */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Assignment Approval Thresholds
          </h4>
          <div className="space-y-2">
            {Object.entries(ASSIGNMENT_THRESHOLDS).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <span className="font-medium capitalize">{key}</span>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </div>
                <Badge variant="outline">
                  Self: {(value.selfClaim / 100000).toFixed(0)}L
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Partner Discount */}
        <div>
          <h4 className="font-medium mb-3">Partner Discount</h4>
          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-green-700 dark:text-green-400">
                  {PARTNER_DISCOUNT.rate}% Auto-Applied Discount
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Applies to: {PARTNER_DISCOUNT.types.map(t => t.toUpperCase()).join(', ')} partners
                </p>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// ABOUT SECTION COMPONENT
// ============================================

function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          About
        </CardTitle>
        <CardDescription>
          Application information and support resources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Version</span>
          <Badge variant="outline">v{APP_VERSION}</Badge>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Support Email</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {SUPPORT_EMAIL}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Documentation</span>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View Docs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <Separator />

        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground">
            JKKN Solutions Hub - A unified platform for tracking all solutions
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            &copy; {new Date().getFullYear()} J.K.K. Nattraja Educational Institutions
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN SETTINGS PAGE
// ============================================

export default function SettingsPage() {
  const { user, loading } = useAuth()

  // Check if user is MD (has system settings access)
  const isMD = user?.role === 'md_caio'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and view system configuration
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Section */}
        <ProfileSection user={user} loading={loading} />

        {/* Notifications Section */}
        <NotificationsSection />

        {/* System Settings - MD Only */}
        {isMD && <SystemSettingsSection />}

        {/* About Section */}
        <AboutSection />
      </div>
    </div>
  )
}
