-- ============================================
-- 013: SCHEMA FIXES
-- Database review fixes for JKKN Solutions Hub
-- ============================================

-- ============================================
-- 1. MISSING NOT NULL CONSTRAINTS
-- ============================================

-- solution_phases.solution_id should be NOT NULL (it's a required relationship)
ALTER TABLE solution_phases
  ALTER COLUMN solution_id SET NOT NULL;

-- ============================================
-- 2. MISSING CHECK CONSTRAINTS
-- ============================================

-- cohort_members.status needs valid values
ALTER TABLE cohort_members
  ADD CONSTRAINT cohort_members_status_check
  CHECK (status IN ('active', 'inactive', 'graduated', 'suspended'));

-- production_learners.status needs valid values
ALTER TABLE production_learners
  ADD CONSTRAINT production_learners_status_check
  CHECK (status IN ('active', 'inactive', 'graduated', 'suspended'));

-- ============================================
-- 3. MISSING DEFAULT VALUES
-- ============================================

-- bug_reports.severity should default to 'medium'
ALTER TABLE bug_reports
  ALTER COLUMN severity SET DEFAULT 'medium';

-- ============================================
-- 4. MISSING FOREIGN KEY CONSTRAINTS
-- ============================================

-- publication_contributors.learner_id should reference production_learners
ALTER TABLE publication_contributors
  ADD CONSTRAINT publication_contributors_learner_fk
  FOREIGN KEY (learner_id) REFERENCES production_learners(id) ON DELETE SET NULL;

-- ============================================
-- 5. MISSING INDEXES FOR COMMON QUERY PATTERNS
-- ============================================

-- Solutions created by user (My Solutions view)
CREATE INDEX idx_solutions_created_by ON solutions(created_by);

-- Solution phases created by user
CREATE INDEX idx_phases_created_by ON solution_phases(created_by);

-- Bug reports sorted by date
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- Content deliverables sorted by date
CREATE INDEX idx_content_deliverables_created_at ON content_deliverables(created_at DESC);

-- Training sessions ordered within program
CREATE INDEX idx_training_sessions_program_number ON training_sessions(program_id, session_number);

-- Discovery visits by date (for dashboard)
CREATE INDEX idx_discovery_visits_created_at ON discovery_visits(created_at DESC);

-- Client communications by recorded_by (My Communications)
CREATE INDEX idx_client_communications_recorded_by ON client_communications(recorded_by);

-- Publications by created_by
CREATE INDEX idx_publications_created_by ON publications(created_by);

-- JICATE sessions by date range (calendar view)
CREATE INDEX idx_jicate_sessions_date_time ON jicate_sessions(session_date, session_time);

-- Earnings ledger by paid status for payroll
CREATE INDEX idx_earnings_ledger_paid_at ON earnings_ledger(paid_at);

-- Solution MOUs by dates for renewal tracking
CREATE INDEX idx_solution_mous_expiry_date ON solution_mous(expiry_date);
CREATE INDEX idx_solution_mous_signed_date ON solution_mous(signed_date);

-- ============================================
-- 6. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================

-- Active builders by department
CREATE INDEX idx_builders_active_department ON builders(department_id, is_active) WHERE is_active = true;

-- Active solutions by type and status
CREATE INDEX idx_solutions_type_status ON solutions(solution_type, status);

-- Pending payments due date
CREATE INDEX idx_payments_pending_due ON payments(due_date) WHERE status = 'pending';

-- Unassigned tasks (phases without active builder assignments)
CREATE INDEX idx_phases_active_status ON solution_phases(status) WHERE status NOT IN ('completed', 'cancelled');

-- Active cohort members by level for assignment
CREATE INDEX idx_cohort_members_active_level ON cohort_members(level, track) WHERE status = 'active';

-- ============================================
-- 7. PREVENT DUPLICATE ACTIVE ASSIGNMENTS
-- ============================================

-- Prevent duplicate active builder assignments to same phase
CREATE UNIQUE INDEX idx_builder_assignments_active_unique
  ON builder_assignments(phase_id, builder_id)
  WHERE status IN ('requested', 'approved', 'active');

-- ============================================
-- 8. ADD MISSING UPDATED_AT TRIGGERS
-- ============================================

-- bug_reports needs updated_at column and trigger
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- content_deliverables needs updated_at column and trigger
ALTER TABLE content_deliverables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER update_content_deliverables_updated_at
  BEFORE UPDATE ON content_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- builder_assignments needs updated_at column and trigger
ALTER TABLE builder_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER update_builder_assignments_updated_at
  BEFORE UPDATE ON builder_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- cohort_assignments needs updated_at column and trigger
ALTER TABLE cohort_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER update_cohort_assignments_updated_at
  BEFORE UPDATE ON cohort_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- production_assignments needs updated_at column and trigger
ALTER TABLE production_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER update_production_assignments_updated_at
  BEFORE UPDATE ON production_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- production_learners needs updated_at column and trigger
ALTER TABLE production_learners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER update_production_learners_updated_at
  BEFORE UPDATE ON production_learners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. SOFT DELETE SUPPORT FOR CRITICAL TABLES
-- ============================================

-- Add deleted_at for soft delete on clients (prevent cascade issues)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NULL;

-- Add deleted_at for soft delete on solutions
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX idx_solutions_deleted_at ON solutions(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- 10. SEED JKKN DEPARTMENTS
-- ============================================

INSERT INTO departments (name, code, institution, is_active) VALUES
  ('JKKN College of Engineering & Technology', 'JKKN-ENG', 'Engineering', true),
  ('JKKN College of Pharmacy', 'JKKN-PHARM', 'Pharmacy', true),
  ('JKKN College of Arts & Science', 'JKKN-ARTS', 'Arts & Science', true),
  ('JKKN College of Allied Health Sciences', 'JKKN-AHS', 'Allied Health Sciences', true),
  ('JKKN College of Nursing', 'JKKN-NURS', 'Nursing', true),
  ('JKKN Dental College & Hospital', 'JKKN-DENT', 'Dental', true),
  ('JKKN Medical College & Hospital', 'JKKN-MED', 'Medical', true),
  ('JKKN International School', 'JKKN-SCHOOL', 'School', true),
  ('JICATE - Innovation Center', 'JICATE', 'Innovation', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 11. ADD HELPER FUNCTIONS
-- ============================================

-- Function to safely get client with soft delete check
CREATE OR REPLACE FUNCTION get_active_client(p_client_id UUID)
RETURNS SETOF clients AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM clients
  WHERE id = p_client_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user can claim assignment based on solution value
CREATE OR REPLACE FUNCTION can_self_claim_assignment(
  p_solution_type TEXT,
  p_estimated_value DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Thresholds from business rules
  RETURN CASE p_solution_type
    WHEN 'software' THEN p_estimated_value <= 300000  -- ≤3L
    WHEN 'training' THEN p_estimated_value <= 200000  -- ≤2L
    WHEN 'content' THEN p_estimated_value <= 50000    -- ≤50K
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 12. ADD VALIDATION TRIGGER FOR PARTNER DISCOUNT
-- ============================================

-- Auto-apply 50% partner discount for qualifying partners
CREATE OR REPLACE FUNCTION apply_partner_discount()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_status TEXT;
BEGIN
  -- Get client's partner status
  SELECT partner_status INTO v_partner_status
  FROM clients WHERE id = NEW.client_id;

  -- Auto-apply 50% discount for qualifying partners
  IF v_partner_status IN ('yi', 'alumni', 'mou', 'referral') THEN
    NEW.partner_discount_applied := 0.50;
    IF NEW.base_price IS NOT NULL THEN
      NEW.final_price := NEW.base_price * (1 - 0.50);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apply_partner_discount_trigger
  BEFORE INSERT ON solutions
  FOR EACH ROW
  WHEN (NEW.partner_discount_applied IS NULL OR NEW.partner_discount_applied = 0)
  EXECUTE FUNCTION apply_partner_discount();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION can_self_claim_assignment IS 'Check if assignment can be self-claimed based on solution type and value thresholds';
COMMENT ON FUNCTION apply_partner_discount IS 'Auto-apply 50% partner discount for yi/alumni/mou/referral clients';
COMMENT ON COLUMN clients.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN solutions.deleted_at IS 'Soft delete timestamp - NULL means active';
