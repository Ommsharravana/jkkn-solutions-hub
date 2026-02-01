-- ============================================
-- 001: DEPARTMENTS
-- Core institutional structure
-- ============================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  institution VARCHAR(255) NOT NULL,

  -- Contact
  hod_name VARCHAR(255),
  hod_email VARCHAR(255),
  hod_phone VARCHAR(20),

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_institution ON departments(institution);
CREATE INDEX idx_departments_is_active ON departments(is_active);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE departments IS 'JKKN institutional departments - 9 institutions';
COMMENT ON COLUMN departments.code IS 'Short code like JKKN-ENG, JKKN-PHARM, etc.';
