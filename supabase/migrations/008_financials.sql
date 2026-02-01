-- ============================================
-- 008: FINANCIALS
-- Revenue splits, payments, earnings
-- ============================================

-- ============================================
-- REVENUE SPLIT MODELS
-- ============================================

CREATE TABLE revenue_split_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_type TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  split_config JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic link to payment source
  phase_id UUID REFERENCES solution_phases(id) ON DELETE SET NULL,
  program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL,
  order_id UUID REFERENCES content_orders(id) ON DELETE SET NULL,

  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  payment_type TEXT CHECK (payment_type IN ('advance', 'milestone', 'completion', 'amc', 'mou_signing', 'deployment', 'acceptance')),
  payment_method TEXT,
  reference_number TEXT,

  due_date DATE,
  paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'received', 'overdue', 'failed')),

  -- Split tracking
  split_model_id UUID REFERENCES revenue_split_models(id) ON DELETE SET NULL,
  split_calculated BOOLEAN DEFAULT FALSE,

  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- At least one source required
  CONSTRAINT payment_source CHECK (phase_id IS NOT NULL OR program_id IS NOT NULL OR order_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_payments_phase ON payments(phase_id);
CREATE INDEX idx_payments_program ON payments(program_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_payments_split_calculated ON payments(split_calculated);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- EARNINGS LEDGER
-- ============================================

CREATE TABLE earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,

  recipient_type TEXT CHECK (recipient_type IN (
    'builder', 'cohort_member', 'production_learner',
    'department', 'jicate', 'institution', 'council', 'infrastructure',
    'referral_bonus'
  )),
  recipient_id UUID, -- ID of builder/cohort_member/learner/department
  recipient_name TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),

  status TEXT DEFAULT 'calculated' CHECK (status IN ('calculated', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_earnings_ledger_payment ON earnings_ledger(payment_id);
CREATE INDEX idx_earnings_ledger_recipient_type ON earnings_ledger(recipient_type);
CREATE INDEX idx_earnings_ledger_recipient ON earnings_ledger(recipient_id);
CREATE INDEX idx_earnings_ledger_department ON earnings_ledger(department_id);
CREATE INDEX idx_earnings_ledger_status ON earnings_ledger(status);

-- ============================================
-- CLIENT REFERRALS
-- ============================================

CREATE TABLE client_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,

  referring_department_id UUID REFERENCES departments(id) ON DELETE SET NULL NOT NULL,
  executing_department_id UUID REFERENCES departments(id) ON DELETE SET NULL NOT NULL,

  referral_date DATE NOT NULL,
  first_phase_id UUID REFERENCES solution_phases(id) ON DELETE SET NULL, -- Tracks which phase triggered bonus
  bonus_percentage DECIMAL(5,2) DEFAULT 10.00 CHECK (bonus_percentage >= 0 AND bonus_percentage <= 100),
  bonus_paid BOOLEAN DEFAULT false,
  bonus_amount DECIMAL(12,2) CHECK (bonus_amount >= 0),
  paid_date DATE,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_client_referrals_client ON client_referrals(client_id);
CREATE INDEX idx_client_referrals_referring ON client_referrals(referring_department_id);
CREATE INDEX idx_client_referrals_executing ON client_referrals(executing_department_id);
CREATE INDEX idx_client_referrals_bonus_paid ON client_referrals(bonus_paid);

-- Comments
COMMENT ON TABLE revenue_split_models IS 'Configurable revenue split models by solution type';
COMMENT ON COLUMN revenue_split_models.split_config IS 'JSON object with percentage splits by recipient type';
COMMENT ON TABLE payments IS 'All payments received for solutions';
COMMENT ON COLUMN payments.split_calculated IS 'TRUE once earnings_ledger entries have been created';
COMMENT ON TABLE earnings_ledger IS 'Individual earnings entries from payments';
COMMENT ON COLUMN earnings_ledger.recipient_type IS 'Type of recipient receiving this share';
COMMENT ON TABLE client_referrals IS 'Cross-department referral tracking for bonus payments';
COMMENT ON COLUMN client_referrals.bonus_percentage IS '10% from department share on first phase';
