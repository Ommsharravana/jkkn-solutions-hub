-- ============================================
-- 019: FIX is_admin() AND is_hod() ROLE CHECKS
-- Bug: Functions checked for 'admin'/'hod' but actual roles are 'md_caio'/'department_head'
-- ============================================

-- Fix is_admin() to check correct role values using get_user_role() from 015_users_table.sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- md_caio = MD/CAIO - master access
  -- jicate_staff = JICATE Staff - also needs admin-level access per spec
  RETURN get_user_role() IN ('md_caio', 'jicate_staff');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fix is_hod() to check correct role value
CREATE OR REPLACE FUNCTION is_hod()
RETURNS BOOLEAN AS $$
BEGIN
  -- department_head = Department Head (HOD)
  RETURN get_user_role() = 'department_head';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION is_admin IS 'Returns true if current user has admin role (md_caio or jicate_staff)';
COMMENT ON FUNCTION is_hod IS 'Returns true if current user is a department head';
