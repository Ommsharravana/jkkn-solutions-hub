-- ============================================
-- 005: TRAINING MODULE
-- Programs, Sessions, Cohort Members
-- ============================================

-- ============================================
-- TRAINING PROGRAMS
-- ============================================

CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE UNIQUE,

  program_type TEXT CHECK (program_type IN (
    'assessment', 'phase1_champion', 'phase2_implementation',
    'phase3_training', 'workshop', 'full_journey', 'custom'
  )),
  track TEXT CHECK (track IN ('track_a', 'track_b')), -- A=community, B=corporate

  participant_count INTEGER CHECK (participant_count > 0),
  location TEXT,
  location_preference TEXT CHECK (location_preference IN ('on_site', 'remote', 'hybrid')),

  scheduled_start DATE,
  scheduled_end DATE,
  actual_start DATE,
  actual_end DATE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_programs_solution ON training_programs(solution_id);
CREATE INDEX idx_training_programs_type ON training_programs(program_type);
CREATE INDEX idx_training_programs_track ON training_programs(track);
CREATE INDEX idx_training_programs_scheduled_start ON training_programs(scheduled_start);

-- Trigger for updated_at
CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON training_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRAINING SESSIONS
-- ============================================

CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,

  session_number INTEGER,
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
  location TEXT,
  google_calendar_event_id TEXT,

  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  attendance_count INTEGER CHECK (attendance_count >= 0),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_sessions_program ON training_sessions(program_id);
CREATE INDEX idx_training_sessions_scheduled ON training_sessions(scheduled_at);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);

-- ============================================
-- COHORT MEMBERS (Training Talent)
-- ============================================

CREATE TABLE cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- MyJKKN user via OAuth

  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  level INTEGER DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
  track TEXT CHECK (track IN ('track_a', 'track_b', 'both')),

  sessions_observed INTEGER DEFAULT 0 CHECK (sessions_observed >= 0),
  sessions_co_led INTEGER DEFAULT 0 CHECK (sessions_co_led >= 0),
  sessions_led INTEGER DEFAULT 0 CHECK (sessions_led >= 0),

  total_earnings DECIMAL(12,2) DEFAULT 0 CHECK (total_earnings >= 0),

  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cohort_members_user ON cohort_members(user_id);
CREATE INDEX idx_cohort_members_department ON cohort_members(department_id);
CREATE INDEX idx_cohort_members_level ON cohort_members(level);
CREATE INDEX idx_cohort_members_track ON cohort_members(track);
CREATE INDEX idx_cohort_members_status ON cohort_members(status);

-- Trigger for updated_at
CREATE TRIGGER update_cohort_members_updated_at
  BEFORE UPDATE ON cohort_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COHORT ASSIGNMENTS
-- ============================================

CREATE TABLE cohort_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  cohort_member_id UUID REFERENCES cohort_members(id) ON DELETE CASCADE,

  role TEXT CHECK (role IN ('observer', 'co_lead', 'lead', 'support')),
  assigned_by UUID, -- null if self-claimed

  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  earnings DECIMAL(10,2) CHECK (earnings >= 0),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),

  UNIQUE(session_id, cohort_member_id)
);

-- Indexes
CREATE INDEX idx_cohort_assignments_session ON cohort_assignments(session_id);
CREATE INDEX idx_cohort_assignments_member ON cohort_assignments(cohort_member_id);
CREATE INDEX idx_cohort_assignments_role ON cohort_assignments(role);

-- Comments
COMMENT ON TABLE training_programs IS 'Training program definitions linked to solutions';
COMMENT ON COLUMN training_programs.track IS 'track_a=community (60-20-20), track_b=corporate (30-20-30-20)';
COMMENT ON TABLE training_sessions IS 'Individual sessions within training programs';
COMMENT ON TABLE cohort_members IS 'AI Cohort members (50-60 members) who deliver training';
COMMENT ON COLUMN cohort_members.level IS '0=Observer, 1=Co-lead, 2=Lead, 3=Master';
COMMENT ON TABLE cohort_assignments IS 'Assignment of cohort members to training sessions';
COMMENT ON COLUMN cohort_assignments.assigned_by IS 'NULL if self-claimed, UUID if assigned by admin';
