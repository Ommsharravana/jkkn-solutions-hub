-- ============================================
-- 010: JICATE SESSIONS
-- Internal booking for solution/phase work
-- ============================================

CREATE TABLE jicate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to solution or phase
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,

  session_date DATE NOT NULL,
  session_time TIME,
  duration_hours DECIMAL(4,2) CHECK (duration_hours > 0),

  booked_by_department_id UUID REFERENCES departments(id) ON DELETE SET NULL NOT NULL,
  attendees JSONB DEFAULT '[]'::jsonb,
  jicate_facilitator VARCHAR(255),

  session_notes TEXT,
  outcome TEXT CHECK (outcome IN ('completed', 'partial', 'rescheduled', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT session_link CHECK (solution_id IS NOT NULL OR phase_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_jicate_sessions_solution ON jicate_sessions(solution_id);
CREATE INDEX idx_jicate_sessions_phase ON jicate_sessions(phase_id);
CREATE INDEX idx_jicate_sessions_date ON jicate_sessions(session_date);
CREATE INDEX idx_jicate_sessions_department ON jicate_sessions(booked_by_department_id);
CREATE INDEX idx_jicate_sessions_outcome ON jicate_sessions(outcome);

-- Comments
COMMENT ON TABLE jicate_sessions IS 'JICATE office booking sessions for solutions/phases';
COMMENT ON COLUMN jicate_sessions.attendees IS 'JSON array of attendee names and roles';
COMMENT ON COLUMN jicate_sessions.outcome IS 'Session outcome: completed, partial, rescheduled, cancelled';
