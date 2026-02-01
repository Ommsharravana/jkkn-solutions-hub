-- ============================================
-- 006: CONTENT MODULE
-- Orders, Deliverables, Production Learners
-- ============================================

-- ============================================
-- CONTENT ORDERS
-- ============================================

CREATE TABLE content_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE UNIQUE,

  order_type TEXT CHECK (order_type IN (
    'video', 'social_media', 'presentation', 'writing',
    'branding', 'podcast', 'package'
  )),

  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  style_preference TEXT,
  brand_guidelines_url TEXT,

  division TEXT CHECK (division IN ('video', 'graphics', 'content', 'education', 'translation', 'research')),

  due_date DATE,
  revision_rounds INTEGER DEFAULT 2 CHECK (revision_rounds >= 0),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_orders_solution ON content_orders(solution_id);
CREATE INDEX idx_content_orders_type ON content_orders(order_type);
CREATE INDEX idx_content_orders_division ON content_orders(division);
CREATE INDEX idx_content_orders_due_date ON content_orders(due_date);

-- Trigger for updated_at
CREATE TRIGGER update_content_orders_updated_at
  BEFORE UPDATE ON content_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CONTENT DELIVERABLES
-- ============================================

CREATE TABLE content_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES content_orders(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'review', 'revision', 'approved', 'rejected'
  )),
  revision_count INTEGER DEFAULT 0 CHECK (revision_count >= 0),

  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_deliverables_order ON content_deliverables(order_id);
CREATE INDEX idx_content_deliverables_status ON content_deliverables(status);

-- ============================================
-- PRODUCTION LEARNERS (Content Talent)
-- ============================================

CREATE TABLE production_learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- MyJKKN user via OAuth

  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  division TEXT CHECK (division IN ('video', 'graphics', 'content', 'education', 'translation', 'research')),
  skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  orders_completed INTEGER DEFAULT 0 CHECK (orders_completed >= 0),
  total_earnings DECIMAL(12,2) DEFAULT 0 CHECK (total_earnings >= 0),
  avg_rating DECIMAL(2,1) CHECK (avg_rating >= 0 AND avg_rating <= 5),

  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_production_learners_user ON production_learners(user_id);
CREATE INDEX idx_production_learners_division ON production_learners(division);
CREATE INDEX idx_production_learners_skill_level ON production_learners(skill_level);
CREATE INDEX idx_production_learners_status ON production_learners(status);

-- ============================================
-- PRODUCTION ASSIGNMENTS
-- ============================================

CREATE TABLE production_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID REFERENCES content_deliverables(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES production_learners(id) ON DELETE CASCADE,

  role TEXT DEFAULT 'contributor' CHECK (role IN ('lead', 'contributor', 'reviewer')),
  assigned_by UUID, -- null if self-claimed

  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  earnings DECIMAL(10,2) CHECK (earnings >= 0),
  quality_rating DECIMAL(2,1) CHECK (quality_rating >= 0 AND quality_rating <= 5),

  UNIQUE(deliverable_id, learner_id)
);

-- Indexes
CREATE INDEX idx_production_assignments_deliverable ON production_assignments(deliverable_id);
CREATE INDEX idx_production_assignments_learner ON production_assignments(learner_id);
CREATE INDEX idx_production_assignments_role ON production_assignments(role);

-- Comments
COMMENT ON TABLE content_orders IS 'Content orders linked to solutions';
COMMENT ON COLUMN content_orders.division IS 'Production division: video, graphics, content, education, translation, research';
COMMENT ON TABLE content_deliverables IS 'Individual deliverable items within content orders';
COMMENT ON COLUMN content_deliverables.revision_count IS 'Number of revision rounds completed';
COMMENT ON TABLE production_learners IS 'Content production talent pool (700+ learners)';
COMMENT ON TABLE production_assignments IS 'Assignment of learners to deliverables';
