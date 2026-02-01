-- ============================================
-- 002: CLIENTS
-- External and internal client management
-- ============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  company_size VARCHAR(50),

  -- Source
  source_type TEXT CHECK (source_type IN ('placement', 'alumni', 'clinical', 'referral', 'direct', 'yi', 'intent')),
  source_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  source_contact_name VARCHAR(255),

  -- Partner Status
  partner_status TEXT DEFAULT 'standard' CHECK (partner_status IN ('standard', 'yi', 'alumni', 'mou', 'referral')),
  partner_since TIMESTAMPTZ,
  referral_count INTEGER DEFAULT 0,
  partner_discount DECIMAL(3,2) DEFAULT 0.00 CHECK (partner_discount >= 0 AND partner_discount <= 1),

  -- Intent Platform Link
  intent_agency_id UUID, -- References intent_agencies if from Intent

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_industry ON clients(industry);
CREATE INDEX idx_clients_partner_status ON clients(partner_status);
CREATE INDEX idx_clients_source_department ON clients(source_department_id);
CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_clients_intent_agency ON clients(intent_agency_id);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE clients IS 'All clients - external companies, partners, and internal projects';
COMMENT ON COLUMN clients.partner_status IS 'Partner type: yi=Young Indians, alumni=JKKN Alumni, mou=MoU partner, referral=2+ referrals';
COMMENT ON COLUMN clients.partner_discount IS 'Discount percentage as decimal (0.50 = 50%)';
COMMENT ON COLUMN clients.referral_count IS 'Number of clients this client has referred';
