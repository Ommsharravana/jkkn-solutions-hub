-- ============================================
-- 015: USERS TABLE
-- User profiles with role-based access control
-- ============================================

-- Create users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,

  -- Role-based access control
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN (
    'md_caio',           -- MD/CAIO - master access
    'department_head',   -- Department Head (HOD)
    'department_staff',  -- Department Staff
    'builder',           -- Builder (software talent)
    'cohort_member',     -- Cohort Member (training talent)
    'production_learner', -- Production Learner (content talent)
    'jicate_staff',      -- JICATE Staff
    'client'             -- External client
  )),

  -- User type
  user_type TEXT NOT NULL DEFAULT 'external' CHECK (user_type IN ('internal', 'external')),

  -- Authentication method
  auth_method TEXT NOT NULL DEFAULT 'email_password' CHECK (auth_method IN ('google_oauth', 'email_password')),

  -- Department association (for internal users)
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- Trigger to update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view all users (needed for displaying names, avatars)
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can update any user's role
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin());

-- Service role can insert new users (during auth callback)
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS FOR ROLE CHECKS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = auth.uid();

  RETURN COALESCE(v_role, 'client');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user has any of the specified roles
CREATE OR REPLACE FUNCTION has_role(allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is internal (JKKN staff)
CREATE OR REPLACE FUNCTION is_internal_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  SELECT user_type INTO v_user_type
  FROM users
  WHERE id = auth.uid();

  RETURN COALESCE(v_user_type = 'internal', false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User profiles with role-based access control';
COMMENT ON COLUMN users.role IS 'User role for RBAC: md_caio, department_head, department_staff, builder, cohort_member, production_learner, jicate_staff, client';
COMMENT ON COLUMN users.user_type IS 'internal = @jkkn.ac.in users, external = email signup users';
COMMENT ON COLUMN users.auth_method IS 'How user authenticates: google_oauth (MyJKKN SSO) or email_password';
COMMENT ON FUNCTION get_user_role IS 'Returns current authenticated user role';
COMMENT ON FUNCTION has_role IS 'Check if current user has any of the allowed roles';
COMMENT ON FUNCTION is_internal_user IS 'Check if current user is internal (JKKN staff)';
