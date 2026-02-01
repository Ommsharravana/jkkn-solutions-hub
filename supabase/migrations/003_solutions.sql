-- ============================================
-- 003: SOLUTIONS
-- Unified solution tracking for all 3 types
-- ============================================

CREATE TABLE solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_code VARCHAR(30) NOT NULL UNIQUE, -- JKKN-SOL-2026-001

  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  solution_type TEXT NOT NULL CHECK (solution_type IN ('software', 'training', 'content')),

  -- From Intent Platform (if applicable)
  intent_session_id UUID,
  intent_prd_id UUID,

  title VARCHAR(255) NOT NULL,
  problem_statement TEXT,
  description TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled', 'in_amc')),

  -- Ownership
  lead_department_id UUID REFERENCES departments(id) ON DELETE SET NULL NOT NULL,

  -- Pricing
  base_price DECIMAL(12,2) CHECK (base_price >= 0),
  partner_discount_applied DECIMAL(3,2) DEFAULT 0 CHECK (partner_discount_applied >= 0 AND partner_discount_applied <= 1),
  final_price DECIMAL(12,2) CHECK (final_price >= 0),

  -- Timeline
  started_date DATE,
  target_completion DATE,
  completed_date DATE,

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_solutions_code ON solutions(solution_code);
CREATE INDEX idx_solutions_client ON solutions(client_id);
CREATE INDEX idx_solutions_type ON solutions(solution_type);
CREATE INDEX idx_solutions_status ON solutions(status);
CREATE INDEX idx_solutions_lead_department ON solutions(lead_department_id);
CREATE INDEX idx_solutions_intent_session ON solutions(intent_session_id);
CREATE INDEX idx_solutions_created_at ON solutions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_solutions_updated_at
  BEFORE UPDATE ON solutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate solution code
CREATE OR REPLACE FUNCTION generate_solution_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := to_char(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(solution_code FROM 'JKKN-SOL-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM solutions
  WHERE solution_code LIKE 'JKKN-SOL-' || year_part || '-%';

  new_code := 'JKKN-SOL-' || year_part || '-' || LPAD(seq_num::TEXT, 3, '0');
  NEW.solution_code := new_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_solution_code_trigger
  BEFORE INSERT ON solutions
  FOR EACH ROW
  WHEN (NEW.solution_code IS NULL OR NEW.solution_code = '')
  EXECUTE FUNCTION generate_solution_code();

-- Comments
COMMENT ON TABLE solutions IS 'Unified solution tracking - software, training, and content';
COMMENT ON COLUMN solutions.solution_code IS 'Auto-generated unique code: JKKN-SOL-YYYY-NNN';
COMMENT ON COLUMN solutions.intent_session_id IS 'Link to Intent Platform interview session';
COMMENT ON COLUMN solutions.partner_discount_applied IS 'Actual discount applied (0.50 = 50%)';
