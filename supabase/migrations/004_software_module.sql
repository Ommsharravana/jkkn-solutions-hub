-- ============================================
-- 004: SOFTWARE MODULE
-- Phases, Builders, Iterations, Bugs, Deployments
-- ============================================

-- ============================================
-- SOLUTION PHASES (Work Units)
-- ============================================

CREATE TABLE solution_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,

  phase_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Status (14 steps)
  status TEXT DEFAULT 'prospecting' CHECK (status IN (
    'prospecting', 'discovery', 'prd_writing', 'prototype_building',
    'client_demo', 'revisions', 'approved', 'deploying', 'training',
    'live', 'in_amc', 'completed', 'on_hold', 'cancelled'
  )),

  -- Ownership (can differ from solution for handoffs)
  owner_department_id UUID REFERENCES departments(id) ON DELETE SET NULL NOT NULL,

  -- URLs
  prd_url VARCHAR(500),
  prototype_url VARCHAR(500),
  production_url VARCHAR(500),

  -- Pricing
  estimated_value DECIMAL(12,2) CHECK (estimated_value >= 0),

  -- Timeline
  started_date DATE,
  target_completion DATE,
  completed_date DATE,

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(solution_id, phase_number)
);

-- Indexes
CREATE INDEX idx_phases_solution ON solution_phases(solution_id);
CREATE INDEX idx_phases_status ON solution_phases(status);
CREATE INDEX idx_phases_owner_department ON solution_phases(owner_department_id);
CREATE INDEX idx_phases_created_at ON solution_phases(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_phases_updated_at
  BEFORE UPDATE ON solution_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BUILDERS (Software Talent)
-- ============================================

CREATE TABLE builders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- MyJKKN user via OAuth

  name TEXT NOT NULL,
  email TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  trained_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_builders_user ON builders(user_id);
CREATE INDEX idx_builders_department ON builders(department_id);
CREATE INDEX idx_builders_is_active ON builders(is_active);
CREATE INDEX idx_builders_name ON builders(name);

-- Trigger for updated_at
CREATE TRIGGER update_builders_updated_at
  BEFORE UPDATE ON builders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BUILDER SKILLS (Versioned)
-- ============================================

CREATE TABLE builder_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID REFERENCES builders(id) ON DELETE CASCADE,

  skill_name VARCHAR(100) NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  acquired_date DATE,
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(builder_id, skill_name, version)
);

-- Indexes
CREATE INDEX idx_builder_skills_builder ON builder_skills(builder_id);
CREATE INDEX idx_builder_skills_name ON builder_skills(skill_name);
CREATE INDEX idx_builder_skills_proficiency ON builder_skills(proficiency_level);

-- ============================================
-- BUILDER ASSIGNMENTS
-- ============================================

CREATE TABLE builder_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,
  builder_id UUID REFERENCES builders(id) ON DELETE CASCADE,

  role TEXT DEFAULT 'contributor' CHECK (role IN ('lead', 'contributor')),
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'active', 'completed', 'withdrawn')),

  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_builder_assignments_phase ON builder_assignments(phase_id);
CREATE INDEX idx_builder_assignments_builder ON builder_assignments(builder_id);
CREATE INDEX idx_builder_assignments_status ON builder_assignments(status);
CREATE INDEX idx_builder_assignments_role ON builder_assignments(role);

-- ============================================
-- PROTOTYPE ITERATIONS
-- ============================================

CREATE TABLE prototype_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,
  prototype_url VARCHAR(500) NOT NULL,
  changes_made TEXT,
  feedback TEXT,
  demo_date DATE,
  client_approved BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(phase_id, version)
);

-- Indexes
CREATE INDEX idx_prototype_iterations_phase ON prototype_iterations(phase_id);
CREATE INDEX idx_prototype_iterations_version ON prototype_iterations(version);
CREATE INDEX idx_prototype_iterations_approved ON prototype_iterations(client_approved);

-- ============================================
-- BUG REPORTS
-- ============================================

CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iteration_id UUID REFERENCES prototype_iterations(id) ON DELETE CASCADE,

  reported_by VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  screenshots_urls JSONB DEFAULT '[]'::jsonb,

  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bug_reports_iteration ON bug_reports(iteration_id);
CREATE INDEX idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);

-- ============================================
-- PHASE DEPLOYMENTS
-- ============================================

CREATE TABLE phase_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,

  environment TEXT CHECK (environment IN ('staging', 'production')),
  version VARCHAR(20),
  vercel_url VARCHAR(500),
  supabase_project_id VARCHAR(100),
  custom_domain VARCHAR(255),

  deployed_date DATE NOT NULL,
  deployed_by VARCHAR(255) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'deprecated')),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_phase_deployments_phase ON phase_deployments(phase_id);
CREATE INDEX idx_phase_deployments_environment ON phase_deployments(environment);
CREATE INDEX idx_phase_deployments_status ON phase_deployments(status);

-- ============================================
-- IMPLEMENTATION USERS
-- ============================================

CREATE TABLE implementation_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,

  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(100),
  user_email VARCHAR(255),
  trained_date DATE,
  trained_by VARCHAR(255),
  usage_status TEXT DEFAULT 'active' CHECK (usage_status IN ('active', 'inactive', 'churned')),
  last_active DATE,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_implementation_users_phase ON implementation_users(phase_id);
CREATE INDEX idx_implementation_users_status ON implementation_users(usage_status);

-- ============================================
-- SOLUTION MOUS
-- ============================================

CREATE TABLE solution_mous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mou_number VARCHAR(50) NOT NULL UNIQUE,
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE UNIQUE, -- 1:1 with solution

  deal_value DECIMAL(12,2) NOT NULL CHECK (deal_value >= 0),
  amc_value DECIMAL(12,2) CHECK (amc_value >= 0),
  payment_terms JSONB DEFAULT '{"mou_signing": 40, "deployment": 40, "acceptance": 20}'::jsonb,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'active', 'expired', 'renewed')),
  sent_date DATE,
  signed_date DATE,
  start_date DATE,
  expiry_date DATE,
  mou_document_url VARCHAR(500),

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_solution_mous_solution ON solution_mous(solution_id);
CREATE INDEX idx_solution_mous_status ON solution_mous(status);
CREATE INDEX idx_solution_mous_number ON solution_mous(mou_number);

-- Trigger for updated_at
CREATE TRIGGER update_solution_mous_updated_at
  BEFORE UPDATE ON solution_mous
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE solution_phases IS 'Individual phases/milestones within software solutions';
COMMENT ON TABLE builders IS 'Appathon-trained software developers';
COMMENT ON TABLE builder_skills IS 'Versioned skill tracking for builders';
COMMENT ON TABLE builder_assignments IS 'Builder to phase assignments with approval workflow';
COMMENT ON TABLE prototype_iterations IS 'Version history of prototypes with client feedback';
COMMENT ON TABLE bug_reports IS 'Bug tracking for prototype iterations';
COMMENT ON TABLE phase_deployments IS 'Deployment records for phases';
COMMENT ON TABLE implementation_users IS 'End users trained on deployed solutions';
COMMENT ON TABLE solution_mous IS 'Memorandum of Understanding documents';
