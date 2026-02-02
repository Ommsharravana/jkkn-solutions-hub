-- ============================================
-- 018: DEMO ACCOUNTS FOR TESTING
-- Creates test users for all stakeholder roles
-- ============================================

-- Note: This creates user records. Auth users must be created via Supabase Auth UI
-- or by signing up through the app. These records link to those auth users.

-- ============================================
-- DEMO USERS TABLE ENTRIES
-- ============================================

-- 1. MD/CAIO - Admin user
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'demo.md@jkkn.ac.in',
  'Dr. Demo MD',
  'md_caio',
  'internal',
  'google_oauth',
  true,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- 2. Department Head (Engineering)
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'demo.hod@jkkn.ac.in',
  'Prof. Demo HOD',
  'department_head',
  'internal',
  'google_oauth',
  true,
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- 3. Department Staff
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'demo.staff@jkkn.ac.in',
  'Demo Staff Member',
  'department_staff',
  'internal',
  'google_oauth',
  true,
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- 4. JICATE Staff
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'demo.jicate@jkkn.ac.in',
  'Demo JICATE Staff',
  'jicate_staff',
  'internal',
  'google_oauth',
  true,
  (SELECT id FROM departments WHERE code = 'JICATE' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- 5. Builder (Software Developer)
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'demo.builder@jkkn.ac.in',
  'Demo Builder',
  'builder',
  'internal',
  'google_oauth',
  true,
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Create builder profile
INSERT INTO builders (id, user_id, name, email, phone, department_id, skill_level, is_active, status)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'Demo Builder',
  'demo.builder@jkkn.ac.in',
  '+91 98765 43210',
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1),
  'intermediate',
  true,
  'available'
) ON CONFLICT (id) DO NOTHING;

-- Add builder skills
INSERT INTO builder_skills (builder_id, skill_name, proficiency_level)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'React', 4),
  ('b0000000-0000-0000-0000-000000000001', 'Node.js', 3),
  ('b0000000-0000-0000-0000-000000000001', 'PostgreSQL', 3),
  ('b0000000-0000-0000-0000-000000000001', 'TypeScript', 4)
ON CONFLICT DO NOTHING;

-- 6. Cohort Member (Training)
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'demo.cohort@jkkn.ac.in',
  'Demo Cohort Member',
  'cohort_member',
  'internal',
  'google_oauth',
  true,
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Create cohort member profile
INSERT INTO cohort_members (id, user_id, name, email, phone, department_id, level, track, status)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000006',
  'Demo Cohort Member',
  'demo.cohort@jkkn.ac.in',
  '+91 98765 43211',
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1),
  1,
  'track_a',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 7. Production Learner (Content)
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'demo.production@jkkn.ac.in',
  'Demo Production Learner',
  'production_learner',
  'internal',
  'google_oauth',
  true,
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Create production learner profile
INSERT INTO production_learners (id, user_id, name, email, phone, division, skill_level, status)
VALUES (
  'p0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000007',
  'Demo Production Learner',
  'demo.production@jkkn.ac.in',
  '+91 98765 43212',
  'video',
  'intermediate',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 8. External Client
INSERT INTO users (id, email, full_name, role, user_type, auth_method, is_active, department_id)
VALUES (
  'a0000000-0000-0000-0000-000000000008',
  'demo.client@example.com',
  'Demo Client',
  'client',
  'external',
  'email_password',
  true,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Create client record
INSERT INTO clients (id, name, industry, contact_person, contact_phone, contact_email, partner_status, is_active)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'Demo Industries Pvt Ltd',
  'Technology',
  'Demo Client',
  '+91 98765 43213',
  'demo.client@example.com',
  'standard',
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Create a sample solution for testing
INSERT INTO solutions (
  id, solution_code, title, description, client_id, solution_type, status,
  lead_department_id, base_price, final_price, created_by
)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'JKKN-SW-2026-001',
  'Demo ERP System',
  'A demonstration software solution for testing the platform',
  'd0000000-0000-0000-0000-000000000001',
  'software',
  'active',
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1),
  500000,
  500000,
  'a0000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Create a sample phase
INSERT INTO solution_phases (
  id, solution_id, phase_number, name, description, status,
  owner_department_id, estimated_hours, estimated_cost, created_by
)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'Requirements & Design',
  'Initial phase for requirements gathering and system design',
  'active',
  (SELECT id FROM departments WHERE code = 'JKKN-ENG' LIMIT 1),
  80,
  100000,
  'a0000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Demo accounts created for testing all stakeholder roles';
