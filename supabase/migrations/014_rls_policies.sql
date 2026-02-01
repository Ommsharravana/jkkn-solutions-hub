-- ============================================
-- 014: ROW LEVEL SECURITY POLICIES
-- Multi-tenant access control for JKKN Solutions Hub
-- ============================================

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get current user's department ID (from user metadata or profile)
CREATE OR REPLACE FUNCTION get_user_department_id()
RETURNS UUID AS $$
BEGIN
  -- Returns department_id from JWT claims or user profile
  -- This should be populated during authentication
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'department_id')::UUID,
    NULL
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is admin/MD
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role')::TEXT = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is HOD of a department
CREATE OR REPLACE FUNCTION is_hod()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role')::TEXT = 'hod',
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- DEPARTMENTS - Public read, admin write
-- ============================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments are viewable by all authenticated users"
  ON departments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify departments"
  ON departments FOR ALL
  USING (is_admin());

-- ============================================
-- CLIENTS - Department-scoped access
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients viewable by all authenticated users"
  ON clients FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "Clients can be created by authenticated users"
  ON clients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Clients can be updated by source department or admins"
  ON clients FOR UPDATE
  USING (
    source_department_id = get_user_department_id()
    OR is_admin()
    OR is_hod()
  );

-- ============================================
-- SOLUTIONS - Department-scoped access
-- ============================================

ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solutions viewable by all authenticated users"
  ON solutions FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "Solutions can be created by authenticated users"
  ON solutions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solutions can be updated by lead department, creator, or admins"
  ON solutions FOR UPDATE
  USING (
    lead_department_id = get_user_department_id()
    OR created_by = auth.uid()
    OR is_admin()
  );

-- ============================================
-- SOLUTION PHASES - Follows solution access
-- ============================================

ALTER TABLE solution_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Phases viewable by all authenticated users"
  ON solution_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Phases can be created by authenticated users"
  ON solution_phases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Phases can be updated by owner department, creator, or admins"
  ON solution_phases FOR UPDATE
  USING (
    owner_department_id = get_user_department_id()
    OR created_by = auth.uid()
    OR is_admin()
  );

-- ============================================
-- BUILDERS - All authenticated can view, admin can modify
-- ============================================

ALTER TABLE builders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builders viewable by all authenticated users"
  ON builders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Builders can be created/updated by admins or themselves"
  ON builders FOR ALL
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR is_hod()
  );

-- ============================================
-- BUILDER SKILLS - Follows builder access
-- ============================================

ALTER TABLE builder_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builder skills viewable by all authenticated users"
  ON builder_skills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Builder skills can be modified by builder or admins"
  ON builder_skills FOR ALL
  USING (
    EXISTS (SELECT 1 FROM builders WHERE id = builder_skills.builder_id AND user_id = auth.uid())
    OR is_admin()
  );

-- ============================================
-- BUILDER ASSIGNMENTS
-- ============================================

ALTER TABLE builder_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builder assignments viewable by all authenticated users"
  ON builder_assignments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Builder assignments can be created by authenticated users"
  ON builder_assignments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Builder assignments can be updated by approver, builder, or admins"
  ON builder_assignments FOR UPDATE
  USING (
    approved_by = auth.uid()
    OR EXISTS (SELECT 1 FROM builders WHERE id = builder_assignments.builder_id AND user_id = auth.uid())
    OR is_admin()
    OR is_hod()
  );

-- ============================================
-- PROTOTYPE ITERATIONS - Follows phase access
-- ============================================

ALTER TABLE prototype_iterations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iterations viewable by all authenticated users"
  ON prototype_iterations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Iterations can be created/updated by authenticated users"
  ON prototype_iterations FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- BUG REPORTS - Anyone can view/create
-- ============================================

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bug reports viewable by all authenticated users"
  ON bug_reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Bug reports can be created by all authenticated users"
  ON bug_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Bug reports can be updated by authenticated users"
  ON bug_reports FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- PHASE DEPLOYMENTS
-- ============================================

ALTER TABLE phase_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deployments viewable by all authenticated users"
  ON phase_deployments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Deployments can be created by admins"
  ON phase_deployments FOR INSERT
  WITH CHECK (is_admin() OR is_hod());

-- ============================================
-- TRAINING PROGRAMS
-- ============================================

ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Training programs viewable by all authenticated users"
  ON training_programs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Training programs can be created/updated by authenticated users"
  ON training_programs FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- TRAINING SESSIONS
-- ============================================

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Training sessions viewable by all authenticated users"
  ON training_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Training sessions can be created/updated by authenticated users"
  ON training_sessions FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- COHORT MEMBERS
-- ============================================

ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort members viewable by all authenticated users"
  ON cohort_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Cohort members can be modified by themselves or admins"
  ON cohort_members FOR ALL
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR is_hod()
  );

-- ============================================
-- COHORT ASSIGNMENTS
-- ============================================

ALTER TABLE cohort_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort assignments viewable by all authenticated users"
  ON cohort_assignments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Cohort assignments can be created by authenticated users"
  ON cohort_assignments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cohort assignments can be updated by assigned member or admins"
  ON cohort_assignments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM cohort_members WHERE id = cohort_assignments.cohort_member_id AND user_id = auth.uid())
    OR assigned_by = auth.uid()
    OR is_admin()
  );

-- ============================================
-- CONTENT ORDERS
-- ============================================

ALTER TABLE content_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content orders viewable by all authenticated users"
  ON content_orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Content orders can be created/updated by authenticated users"
  ON content_orders FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- CONTENT DELIVERABLES
-- ============================================

ALTER TABLE content_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content deliverables viewable by all authenticated users"
  ON content_deliverables FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Content deliverables can be created/updated by authenticated users"
  ON content_deliverables FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- PRODUCTION LEARNERS
-- ============================================

ALTER TABLE production_learners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Production learners viewable by all authenticated users"
  ON production_learners FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Production learners can be modified by themselves or admins"
  ON production_learners FOR ALL
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR is_hod()
  );

-- ============================================
-- PRODUCTION ASSIGNMENTS
-- ============================================

ALTER TABLE production_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Production assignments viewable by all authenticated users"
  ON production_assignments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Production assignments can be created by authenticated users"
  ON production_assignments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Production assignments can be updated by assigned learner or admins"
  ON production_assignments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM production_learners WHERE id = production_assignments.learner_id AND user_id = auth.uid())
    OR assigned_by = auth.uid()
    OR is_admin()
  );

-- ============================================
-- DISCOVERY VISITS
-- ============================================

ALTER TABLE discovery_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discovery visits viewable by all authenticated users"
  ON discovery_visits FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Discovery visits can be created by authenticated users"
  ON discovery_visits FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Discovery visits can be updated by creator or department"
  ON discovery_visits FOR UPDATE
  USING (
    created_by = auth.uid()
    OR department_id = get_user_department_id()
    OR is_admin()
  );

-- ============================================
-- CLIENT COMMUNICATIONS
-- ============================================

ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communications viewable by all authenticated users"
  ON client_communications FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Communications can be created by authenticated users"
  ON client_communications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Communications can be updated by recorder"
  ON client_communications FOR UPDATE
  USING (
    recorded_by = auth.uid()
    OR is_admin()
  );

-- ============================================
-- PAYMENTS - Restricted access
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments viewable by admins and HODs"
  ON payments FOR SELECT
  USING (is_admin() OR is_hod());

CREATE POLICY "Payments can be created by admins"
  ON payments FOR INSERT
  WITH CHECK (is_admin() OR is_hod());

CREATE POLICY "Payments can be updated by admins"
  ON payments FOR UPDATE
  USING (is_admin());

-- ============================================
-- EARNINGS LEDGER - Restricted access
-- ============================================

ALTER TABLE earnings_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Earnings viewable by recipient or admins"
  ON earnings_ledger FOR SELECT
  USING (
    recipient_id = auth.uid()
    OR department_id = get_user_department_id()
    OR is_admin()
    OR is_hod()
  );

CREATE POLICY "Earnings can be created by admins"
  ON earnings_ledger FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Earnings can be updated by admins"
  ON earnings_ledger FOR UPDATE
  USING (is_admin());

-- ============================================
-- REVENUE SPLIT MODELS - Admin only write
-- ============================================

ALTER TABLE revenue_split_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Revenue models viewable by all authenticated users"
  ON revenue_split_models FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Revenue models can only be modified by admins"
  ON revenue_split_models FOR ALL
  USING (is_admin());

-- ============================================
-- CLIENT REFERRALS
-- ============================================

ALTER TABLE client_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals viewable by involved departments or admins"
  ON client_referrals FOR SELECT
  USING (
    referring_department_id = get_user_department_id()
    OR executing_department_id = get_user_department_id()
    OR is_admin()
    OR is_hod()
  );

CREATE POLICY "Referrals can be created by authenticated users"
  ON client_referrals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PUBLICATIONS
-- ============================================

ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publications viewable by all authenticated users"
  ON publications FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Publications can be created by authenticated users"
  ON publications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Publications can be updated by creator or admins"
  ON publications FOR UPDATE
  USING (
    created_by = auth.uid()
    OR is_admin()
  );

-- ============================================
-- PUBLICATION CONTRIBUTORS
-- ============================================

ALTER TABLE publication_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publication contributors viewable by all authenticated users"
  ON publication_contributors FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Publication contributors can be modified by authenticated users"
  ON publication_contributors FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- ACCREDITATION METRICS - Read-only for most
-- ============================================

ALTER TABLE accreditation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accreditation metrics viewable by all authenticated users"
  ON accreditation_metrics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Accreditation metrics can only be modified by admins"
  ON accreditation_metrics FOR ALL
  USING (is_admin());

-- ============================================
-- JICATE SESSIONS
-- ============================================

ALTER TABLE jicate_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "JICATE sessions viewable by all authenticated users"
  ON jicate_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "JICATE sessions can be created by authenticated users"
  ON jicate_sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "JICATE sessions can be updated by booking department or admins"
  ON jicate_sessions FOR UPDATE
  USING (
    booked_by_department_id = get_user_department_id()
    OR is_admin()
  );

-- ============================================
-- SOLUTION MOUS - Restricted access
-- ============================================

ALTER TABLE solution_mous ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MOUs viewable by admins and HODs"
  ON solution_mous FOR SELECT
  USING (is_admin() OR is_hod());

CREATE POLICY "MOUs can be created by admins"
  ON solution_mous FOR INSERT
  WITH CHECK (is_admin() OR is_hod());

CREATE POLICY "MOUs can be updated by admins or creator"
  ON solution_mous FOR UPDATE
  USING (
    created_by = auth.uid()
    OR is_admin()
  );

-- ============================================
-- IMPLEMENTATION USERS
-- ============================================

ALTER TABLE implementation_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Implementation users viewable by all authenticated users"
  ON implementation_users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Implementation users can be created/updated by authenticated users"
  ON implementation_users FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION get_user_department_id IS 'Returns current user department_id from JWT claims';
COMMENT ON FUNCTION is_admin IS 'Returns true if current user has admin role';
COMMENT ON FUNCTION is_hod IS 'Returns true if current user has HOD role';
