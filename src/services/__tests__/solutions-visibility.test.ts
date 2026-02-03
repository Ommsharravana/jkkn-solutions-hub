/**
 * Integration Test: MD/HOD Solutions Visibility - RLS Policy Bug
 *
 * BUG DISCOVERED:
 * HOD users CANNOT update solutions even when they are in the lead department.
 *
 * ROOT CAUSE:
 * The get_user_department_id() function in 014_rls_policies.sql reads from JWT claims:
 *   (current_setting('request.jwt.claims', true)::json->>'department_id')::UUID
 *
 * But Supabase doesn't automatically include department_id in JWT claims.
 * The users table HAS department_id, but it's not in the JWT.
 *
 * The UPDATE policy for solutions is:
 *   USING (
 *     lead_department_id = get_user_department_id()  <-- Returns NULL!
 *     OR created_by = auth.uid()
 *     OR is_admin()
 *   )
 *
 * Since get_user_department_id() returns NULL (not in JWT), and HOD didn't create
 * the solution, and is_admin() only checks for md_caio/jicate_staff, HOD cannot update.
 *
 * IMPACT:
 * - HOD users cannot update solutions in their department (unless they created them)
 * - This defeats the purpose of department-scoped access control
 *
 * FIX NEEDED:
 * Update get_user_department_id() in 014_rls_policies.sql to read from users table:
 *
 *   CREATE OR REPLACE FUNCTION get_user_department_id()
 *   RETURNS UUID AS $$
 *   DECLARE
 *     v_department_id UUID;
 *   BEGIN
 *     SELECT department_id INTO v_department_id
 *     FROM users
 *     WHERE id = auth.uid();
 *     RETURN v_department_id;
 *   END;
 *   $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Demo user credentials from CLAUDE.md
const MD_EMAIL = 'demo.md@jkkn.ac.in'
const MD_PASSWORD = 'Demo@JKKN2026'
const HOD_EMAIL = 'demo.hod@jkkn.ac.in'
const HOD_PASSWORD = 'Demo@JKKN2026'
const STAFF_EMAIL = 'demo.staff@jkkn.ac.in'
const STAFF_PASSWORD = 'Demo@JKKN2026'

// Test data
let testSolutionId: string
let testClientId: string
let testDepartmentId: string
let adminClient: SupabaseClient

describe('BUG: HOD cannot UPDATE solutions in their department (get_user_department_id() returns NULL)', () => {
  beforeAll(async () => {
    // Admin client bypasses RLS - used for setup/teardown
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get the HOD's department ID
    const { data: hodUser } = await adminClient
      .from('users')
      .select('department_id')
      .eq('email', HOD_EMAIL)
      .single()

    testDepartmentId = hodUser?.department_id

    // Get a client for the test
    const { data: existingClient } = await adminClient
      .from('clients')
      .select('id')
      .limit(1)
      .single()

    testClientId = existingClient?.id

    console.log('Test setup:')
    console.log('  - HOD department_id:', testDepartmentId)
    console.log('  - Client ID:', testClientId)
  })

  afterAll(async () => {
    // Clean up test solution
    if (testSolutionId) {
      await adminClient.from('solutions').delete().eq('id', testSolutionId)
    }
  })

  it('SETUP: Create solution in HOD department (by staff)', async () => {
    const staffClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: staffAuth } = await staffClient.auth.signInWithPassword({
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD,
    })

    // Create solution with lead_department = HOD's department
    const { data: createdSolution, error: createError } = await staffClient
      .from('solutions')
      .insert({
        client_id: testClientId,
        solution_type: 'software',
        title: 'Test Solution - HOD Department Access Bug',
        problem_statement: 'Testing HOD update permissions',
        lead_department_id: testDepartmentId, // HOD's department!
        base_price: 100000,
        final_price: 100000,
        created_by: staffAuth!.user!.id,
        status: 'active',
      })
      .select()
      .single()

    expect(createError).toBeNull()
    testSolutionId = createdSolution.id

    console.log('Created solution:', {
      id: testSolutionId,
      lead_department_id: testDepartmentId,
      created_by: staffAuth!.user!.id,
    })

    await staffClient.auth.signOut()
  })

  it('BUG PROOF: HOD cannot UPDATE solution in their own department', async () => {
    /**
     * This test demonstrates the bug:
     *
     * 1. HOD has department_id set in users table
     * 2. Solution has lead_department_id matching HOD's department
     * 3. HOD should be able to update (via get_user_department_id() check)
     * 4. BUT get_user_department_id() reads from JWT, not users table
     * 5. JWT doesn't have department_id, so it returns NULL
     * 6. NULL != solution.lead_department_id, so update is blocked
     */

    const hodClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: hodAuth } = await hodClient.auth.signInWithPassword({
      email: HOD_EMAIL,
      password: HOD_PASSWORD,
    })

    // Verify HOD's department in users table
    const { data: hodProfile } = await hodClient
      .from('users')
      .select('id, email, role, department_id')
      .eq('id', hodAuth!.user!.id)
      .single()

    console.log('HOD profile (from users table):', hodProfile)
    console.log('Solution lead_department_id:', testDepartmentId)
    console.log('Department match:', hodProfile?.department_id === testDepartmentId)

    expect(hodProfile?.department_id).toBe(testDepartmentId) // Departments MATCH

    // Try to update the solution
    const { data: updateResult, error: updateError } = await hodClient
      .from('solutions')
      .update({ problem_statement: 'Updated by HOD - testing department access' })
      .eq('id', testSolutionId)
      .select()

    console.log('HOD update attempt:')
    console.log('  - Error:', updateError)
    console.log('  - Rows affected:', updateResult?.length ?? 0)

    // THE BUG: HOD cannot update even though departments match
    expect(updateError).toBeNull() // No SQL error
    expect(updateResult).toBeDefined()

    // THIS ASSERTION PROVES THE BUG
    // Expected: 1 row (HOD should update)
    // Actual: 0 rows (blocked by RLS)
    expect(updateResult!.length).toBe(0)

    console.log('')
    console.log('='.repeat(70))
    console.log('BUG CONFIRMED: HOD cannot update solutions in their own department')
    console.log('='.repeat(70))
    console.log('')
    console.log('Root cause: get_user_department_id() reads from JWT claims:')
    console.log('  (current_setting("request.jwt.claims")::json->>"department_id")::UUID')
    console.log('')
    console.log('But JWT does NOT contain department_id by default.')
    console.log('It returns NULL, which never matches lead_department_id.')
    console.log('')
    console.log('Fix: Update get_user_department_id() to read from users table instead.')
    console.log('='.repeat(70))

    await hodClient.auth.signOut()
  })

  it('CONTROL: MD CAN update (via is_admin() which is fixed)', async () => {
    const mdClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    await mdClient.auth.signInWithPassword({
      email: MD_EMAIL,
      password: MD_PASSWORD,
    })

    // MD can update because is_admin() works correctly
    const { data: updateResult, error: updateError } = await mdClient
      .from('solutions')
      .update({ problem_statement: 'Updated by MD' })
      .eq('id', testSolutionId)
      .select()

    console.log('MD update (control):', {
      error: updateError,
      rowsAffected: updateResult?.length,
    })

    expect(updateError).toBeNull()
    expect(updateResult!.length).toBeGreaterThan(0)

    await mdClient.auth.signOut()
  })

  it('EXPECTED: After fix, HOD should update solutions in their department', async () => {
    /**
     * After fixing get_user_department_id() to read from users table,
     * this test should PASS.
     *
     * FIX:
     * CREATE OR REPLACE FUNCTION get_user_department_id()
     * RETURNS UUID AS $$
     * DECLARE
     *   v_department_id UUID;
     * BEGIN
     *   SELECT department_id INTO v_department_id
     *   FROM users
     *   WHERE id = auth.uid();
     *   RETURN v_department_id;
     * END;
     * $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
     */

    const hodClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    await hodClient.auth.signInWithPassword({
      email: HOD_EMAIL,
      password: HOD_PASSWORD,
    })

    const { data: updateResult } = await hodClient
      .from('solutions')
      .update({ problem_statement: 'Updated by HOD after fix' })
      .eq('id', testSolutionId)
      .select()

    // THIS SHOULD PASS AFTER THE FIX
    expect(updateResult!.length).toBeGreaterThan(0)

    await hodClient.auth.signOut()
  })
})
