/**
 * JKKN Solutions Hub - Demo Account Creator
 *
 * Run with: npx ts-node scripts/create-demo-accounts.ts
 *
 * This script creates demo accounts for all stakeholder roles.
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

interface DemoUser {
  email: string
  password: string
  fullName: string
  role: string
  userType: 'internal' | 'external'
  departmentCode?: string
}

const DEMO_PASSWORD = 'Demo@JKKN2026'

const demoUsers: DemoUser[] = [
  {
    email: 'demo.md@jkkn.ac.in',
    password: DEMO_PASSWORD,
    fullName: 'Dr. Demo MD',
    role: 'md_caio',
    userType: 'internal',
  },
  {
    email: 'demo.hod@jkkn.ac.in',
    password: DEMO_PASSWORD,
    fullName: 'Prof. Demo HOD',
    role: 'department_head',
    userType: 'internal',
    departmentCode: 'JKKN-ENG',
  },
  {
    email: 'demo.staff@jkkn.ac.in',
    password: DEMO_PASSWORD,
    fullName: 'Demo Department Staff',
    role: 'department_staff',
    userType: 'internal',
    departmentCode: 'JKKN-ENG',
  },
  {
    email: 'demo.jicate@jkkn.ac.in',
    password: DEMO_PASSWORD,
    fullName: 'Demo JICATE Staff',
    role: 'jicate_staff',
    userType: 'internal',
    departmentCode: 'JICATE',
  },
  {
    email: 'demo.builder@jkkn.ac.in',
    password: DEMO_PASSWORD,
    fullName: 'Demo Builder',
    role: 'builder',
    userType: 'internal',
    departmentCode: 'JKKN-ENG',
  },
  {
    email: 'demo.cohort@jkkn.ac.in',
    password: DEMO_PASSWORD,
    fullName: 'Demo Cohort Member',
    role: 'cohort_member',
    userType: 'internal',
    departmentCode: 'JKKN-ENG',
  },
  {
    email: 'demo.production@jkkn.ac.in',
    password: DEMO_PASSWORD,
    fullName: 'Demo Production Learner',
    role: 'production_learner',
    userType: 'internal',
    departmentCode: 'JKKN-ENG',
  },
  {
    email: 'demo.client@example.com',
    password: DEMO_PASSWORD,
    fullName: 'Demo Client',
    role: 'client',
    userType: 'external',
  },
]

async function createDemoAccounts() {
  console.log('Creating demo accounts for JKKN Solutions Hub...\n')

  // Get departments for reference
  const { data: departments } = await supabase
    .from('departments')
    .select('id, code')

  const deptMap = new Map(departments?.map(d => [d.code, d.id]) || [])

  for (const user of demoUsers) {
    console.log(`Creating: ${user.email} (${user.role})`)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
        },
      })

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`  ⚠️  User already exists, resetting password and updating profile...`)

          // Get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers()
          const existingUser = existingUsers?.users.find(u => u.email === user.email)

          if (existingUser) {
            // Reset password using admin API
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: user.password }
            )

            if (updateError) {
              console.log(`  ✗ Password reset failed: ${updateError.message}`)
            } else {
              console.log(`  ✓ Password reset`)
            }

            // Update user profile in users table
            const departmentId = user.departmentCode ? deptMap.get(user.departmentCode) : null

            await supabase.from('users').upsert({
              id: existingUser.id,
              email: user.email,
              full_name: user.fullName,
              role: user.role,
              user_type: user.userType,
              auth_method: user.userType === 'internal' ? 'google_oauth' : 'email_password',
              department_id: departmentId,
              is_active: true,
            })

            console.log(`  ✓ Profile updated`)
          }
          continue
        }
        throw authError
      }

      if (!authData.user) {
        console.log(`  ✗ Failed to create auth user`)
        continue
      }

      // Create user profile
      const departmentId = user.departmentCode ? deptMap.get(user.departmentCode) : null

      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        user_type: user.userType,
        auth_method: user.userType === 'internal' ? 'google_oauth' : 'email_password',
        department_id: departmentId,
        is_active: true,
      })

      if (profileError) {
        console.log(`  ⚠️  Profile error: ${profileError.message}`)
      }

      // Create role-specific profiles
      if (user.role === 'builder') {
        await supabase.from('builders').insert({
          user_id: authData.user.id,
          name: user.fullName,
          email: user.email,
          phone: '+91 98765 43210',
          department_id: departmentId,
          skill_level: 'intermediate',
          is_active: true,
          status: 'available',
        })
        console.log(`  ✓ Builder profile created`)
      }

      if (user.role === 'cohort_member') {
        await supabase.from('cohort_members').insert({
          user_id: authData.user.id,
          name: user.fullName,
          email: user.email,
          phone: '+91 98765 43211',
          department_id: departmentId,
          level: 1,
          track: 'track_a',
          status: 'active',
        })
        console.log(`  ✓ Cohort member profile created`)
      }

      if (user.role === 'production_learner') {
        await supabase.from('production_learners').insert({
          user_id: authData.user.id,
          name: user.fullName,
          email: user.email,
          phone: '+91 98765 43212',
          division: 'video',
          skill_level: 'intermediate',
          status: 'active',
        })
        console.log(`  ✓ Production learner profile created`)
      }

      if (user.role === 'client') {
        await supabase.from('clients').insert({
          name: 'Demo Industries Pvt Ltd',
          industry: 'Technology',
          contact_person: user.fullName,
          contact_phone: '+91 98765 43213',
          contact_email: user.email,
          partner_status: 'standard',
          is_active: true,
        })
        console.log(`  ✓ Client profile created`)
      }

      console.log(`  ✓ Created successfully`)
    } catch (error) {
      console.log(`  ✗ Error: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('DEMO ACCOUNTS CREATED')
  console.log('='.repeat(60))
  console.log('\nAll accounts use password: ' + DEMO_PASSWORD)
  console.log('\nLogin at: https://jkkn-solutions-hub.vercel.app/auth/login')
  console.log('\n')

  // Print table of accounts
  console.log('| Role | Email | Portal |')
  console.log('|------|-------|--------|')
  console.log('| MD/CAIO | demo.md@jkkn.ac.in | / (Admin Dashboard) |')
  console.log('| HOD | demo.hod@jkkn.ac.in | / (Admin Dashboard) |')
  console.log('| Dept Staff | demo.staff@jkkn.ac.in | / (Admin Dashboard) |')
  console.log('| JICATE | demo.jicate@jkkn.ac.in | / (Admin Dashboard) |')
  console.log('| Builder | demo.builder@jkkn.ac.in | /builder |')
  console.log('| Cohort | demo.cohort@jkkn.ac.in | /cohort |')
  console.log('| Production | demo.production@jkkn.ac.in | /production |')
  console.log('| Client | demo.client@example.com | /portal |')
}

createDemoAccounts().catch(console.error)
