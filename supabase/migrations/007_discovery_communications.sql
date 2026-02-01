-- ============================================
-- 007: DISCOVERY & COMMUNICATIONS
-- Client visits and communication tracking
-- ============================================

-- ============================================
-- DISCOVERY VISITS
-- ============================================

CREATE TABLE discovery_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES solutions(id) ON DELETE SET NULL, -- Optional - may result in new solution
  resulted_phase_id UUID REFERENCES solution_phases(id) ON DELETE SET NULL, -- Phase that resulted from visit

  department_id UUID REFERENCES departments(id) ON DELETE SET NULL NOT NULL,
  visit_date DATE NOT NULL,
  visitors JSONB DEFAULT '[]'::jsonb,
  observations TEXT NOT NULL,
  pain_points JSONB DEFAULT '[]'::jsonb,
  photos_urls JSONB DEFAULT '[]'::jsonb,
  next_steps TEXT,

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_discovery_visits_client ON discovery_visits(client_id);
CREATE INDEX idx_discovery_visits_solution ON discovery_visits(solution_id);
CREATE INDEX idx_discovery_visits_department ON discovery_visits(department_id);
CREATE INDEX idx_discovery_visits_date ON discovery_visits(visit_date DESC);

-- ============================================
-- CLIENT COMMUNICATIONS
-- ============================================

CREATE TABLE client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES solutions(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES solution_phases(id) ON DELETE SET NULL,

  communication_type TEXT CHECK (communication_type IN ('call', 'email', 'whatsapp', 'meeting', 'note')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp_sync', 'gmail_sync')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),

  subject VARCHAR(255),
  summary TEXT NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  external_id VARCHAR(255), -- For synced messages
  attachments_urls JSONB DEFAULT '[]'::jsonb,

  communication_date TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_client_communications_client ON client_communications(client_id);
CREATE INDEX idx_client_communications_solution ON client_communications(solution_id);
CREATE INDEX idx_client_communications_phase ON client_communications(phase_id);
CREATE INDEX idx_client_communications_type ON client_communications(communication_type);
CREATE INDEX idx_client_communications_date ON client_communications(communication_date DESC);
CREATE INDEX idx_client_communications_external ON client_communications(external_id);

-- Comments
COMMENT ON TABLE discovery_visits IS 'Site visits for client discovery and needs assessment';
COMMENT ON COLUMN discovery_visits.visitors IS 'JSON array of visitor names and roles';
COMMENT ON COLUMN discovery_visits.pain_points IS 'JSON array of identified pain points';
COMMENT ON TABLE client_communications IS 'All client communications - manual and synced';
COMMENT ON COLUMN client_communications.source IS 'manual=entered by user, whatsapp_sync/gmail_sync=auto-imported';
COMMENT ON COLUMN client_communications.external_id IS 'External message ID for deduplication on sync';
