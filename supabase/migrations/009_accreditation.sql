-- ============================================
-- 009: ACCREDITATION
-- Publications and NIRF/NAAC metrics
-- ============================================

-- ============================================
-- PUBLICATIONS
-- ============================================

CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES solution_phases(id) ON DELETE SET NULL, -- Optional - some are solution-wide

  paper_type TEXT CHECK (paper_type IN ('problem', 'design', 'technical', 'data', 'impact')),
  title VARCHAR(500) NOT NULL,
  authors JSONB DEFAULT '[]'::jsonb,
  abstract TEXT,

  journal_name VARCHAR(255),
  journal_type TEXT CHECK (journal_type IN ('scopus', 'ugc_care', 'other')),

  status TEXT DEFAULT 'identified' CHECK (status IN (
    'identified', 'drafting', 'submitted', 'under_review',
    'revision', 'accepted', 'published', 'rejected'
  )),

  submitted_date DATE,
  published_date DATE,
  doi VARCHAR(100),
  url VARCHAR(500),

  -- Accreditation
  nirf_category VARCHAR(50),
  naac_criterion VARCHAR(20),

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_publications_solution ON publications(solution_id);
CREATE INDEX idx_publications_phase ON publications(phase_id);
CREATE INDEX idx_publications_paper_type ON publications(paper_type);
CREATE INDEX idx_publications_journal_type ON publications(journal_type);
CREATE INDEX idx_publications_status ON publications(status);
CREATE INDEX idx_publications_published_date ON publications(published_date);
CREATE INDEX idx_publications_nirf_category ON publications(nirf_category);
CREATE INDEX idx_publications_naac_criterion ON publications(naac_criterion);

-- Trigger for updated_at
CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON publications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PUBLICATION CONTRIBUTORS
-- ============================================

CREATE TABLE publication_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,

  -- Polymorphic contributor
  builder_id UUID REFERENCES builders(id) ON DELETE SET NULL,
  cohort_member_id UUID REFERENCES cohort_members(id) ON DELETE SET NULL,
  learner_id UUID, -- General learner reference

  contribution_type VARCHAR(100) NOT NULL,
  credit_type TEXT CHECK (credit_type IN ('coauthor', 'acknowledgment')),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_publication_contributors_publication ON publication_contributors(publication_id);
CREATE INDEX idx_publication_contributors_builder ON publication_contributors(builder_id);
CREATE INDEX idx_publication_contributors_cohort_member ON publication_contributors(cohort_member_id);
CREATE INDEX idx_publication_contributors_credit_type ON publication_contributors(credit_type);

-- ============================================
-- ACCREDITATION METRICS
-- ============================================

CREATE TABLE accreditation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT CHECK (metric_type IN ('nirf', 'naac')),
  metric_code VARCHAR(20) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  description TEXT,
  max_score DECIMAL(8,2) CHECK (max_score >= 0),
  calculation_method TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(metric_type, metric_code)
);

-- Indexes
CREATE INDEX idx_accreditation_metrics_type ON accreditation_metrics(metric_type);
CREATE INDEX idx_accreditation_metrics_active ON accreditation_metrics(is_active);

-- Comments
COMMENT ON TABLE publications IS 'S2P (Solution to Paper) publications linked to solutions/phases';
COMMENT ON COLUMN publications.paper_type IS 'problem=problem statement, design=system design, technical=implementation, data=data analysis, impact=impact study';
COMMENT ON COLUMN publications.journal_type IS 'scopus=Scopus indexed, ugc_care=UGC CARE listed, other=other journals';
COMMENT ON TABLE publication_contributors IS 'Contributors to publications from talent pools';
COMMENT ON TABLE accreditation_metrics IS 'NIRF and NAAC metric definitions for reporting';
