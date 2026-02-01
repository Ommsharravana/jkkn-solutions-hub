# JKKN Solutions Hub - Complete Specification

> **Type:** Child App (SSO-Connected)
> **URL:** solutions.jkkn.ai
> **Owner:** MD/CAIO Office
> **Version:** 1.1 | February 2026 (Post-Interview)

---

## Core Priority (From Interview)

> **#1 Goal: Flow without MD** — Remove MD as bottleneck. 90%+ of solutions should flow without MD involvement.

| Current Bottleneck | Solution |
|--------------------|----------|
| Pricing decisions | Partner auto-discount (50%), HOD can give 10% more (from dept share) |
| Assignment decisions | Threshold-based: self-claim → HOD → MD by value |
| Client status updates | Self-service portals - clients track themselves |
| Payment approvals | Monthly batch, auto-process after 48hrs unless MD flags |

### Assignment Approval Thresholds

| Solution Type | Self-Claim / HOD | MD Required |
|---------------|------------------|-------------|
| **Software** | ≤ ₹3 Lakh | > ₹3 Lakh |
| **Training** | ≤ ₹2 Lakh | > ₹2 Lakh |
| **Content** | ≤ ₹50K | > ₹50K |

### Discount Rules

| Type | Who Can Approve | Source |
|------|-----------------|--------|
| Partner discount (50%) | Auto | System detects partner status |
| HOD discount (up to 10%) | HOD | **Deducted from department's 40% share** |
| > 10% discount | MD | Escalate |

### Payment Processing

- Monthly batch processing
- MD gets visibility into batch
- Auto-process after **48 hours** unless MD flags exception
- Flagged payments require manual resolution

---

## Executive Summary

**JKKN Solutions Hub** is the unified platform for tracking all solutions JKKN provides to the world, aligned with the institutional vision:

> **"To be a Leading Global Innovative Solutions provider for the ever changing needs of the society."**

This specification **merges** the previous Solutions Management module and JICATE Services Hub into a single comprehensive system.

---

## Three Solution Types

| Solution Type | What It Is | Talent Pool | Interview Depth | Revenue Split |
|---------------|------------|-------------|-----------------|---------------|
| **Software** | Custom apps, AI tools, automation | Builders (Appathon grads) | 60-100 questions | 40-40-20 |
| **Training** | AI transformation programs, workshops | AI Cohort (50-60 members) | 20-30 questions | Track A/B models |
| **Content** | Videos, graphics, presentations, writing | Production Learners (700) | 10-15 questions | 60-20-20 |

---

## Architecture Decision: Why Child App?

| Factor | Module (MyJKKN DB) | Child App (Own DB) | Decision |
|--------|-------------------|-------------------|----------|
| Auth | MyJKKN SSO | MyJKKN SSO | Same |
| External clients | Need MyJKKN accounts | Own accounts + self-service | **Child App** |
| Intent Platform | Complex integration | Shared Supabase project | **Child App** |
| Deployments | Part of jkkn.ai | Independent at solutions.jkkn.ai | **Child App** |

**Final Decision:** Child App at `solutions.jkkn.ai`

### Infrastructure (Confirmed in Interview)

| Component | Decision |
|-----------|----------|
| **Database** | NEW Supabase project (Intent Platform will migrate here) |
| **URL** | solutions.jkkn.ai |
| **Intent Platform** | Existing Intent feeds forward (no migration of old data) |

### Authentication Model

| User Type | Auth Method |
|-----------|-------------|
| Internal JKKN (staff, students) | MyJKKN OAuth (Google Sign-in) |
| Alumni | MyJKKN OAuth (they retain access) |
| External clients | Username/password (Supabase Auth) |
| External contractors | Username/password |
| Partner institution talent | Username/password |

### Multi-Role Talent

One person CAN belong to multiple talent pools (common scenario):
- A builder who is also a cohort member
- A cohort member who does content production
- Track earnings separately per role, show unified view

---

## User Roles & What They See

### Internal Users (MyJKKN SSO)

| Role | Dashboard | Key Actions |
|------|-----------|-------------|
| **MD/CAIO** | Master dashboard - all solutions, all revenue | Approve high-value, assign leads, NIRF/NAAC reports |
| **Department Head** | Department's clients, revenue share, leaderboard | Assign cohort/production members, approve builders |
| **Department Staff** | Solutions from my department | Register clients, log discovery visits, write PRDs |
| **Builder** | My assignments, skills, earnings | Request phase assignments, submit work |
| **Cohort Member** | My level, sessions, earnings | Claim/assigned sessions, view schedule |
| **Production Learner** | My orders, division queue, earnings | Claim orders, submit deliverables |
| **JICATE Staff** | All software solutions, sessions | Manage pipeline, assign builders, book sessions |

### External Users (Direct Signup)

| Role | Dashboard | Key Actions |
|------|-----------|-------------|
| **Client** | My solutions, progress, deliverables | Track status, approve deliverables, start new via Intent |
| **Partner Client** | Same + partner pricing visible | Auto 50% discount on all solutions |

---

## Core Data Model

### Entity Hierarchy

```
CLIENT
├── Partner Status (yi, alumni, mou, referral, standard)
├── Solutions (many) ─────────────────────────────────────────┐
│   ├── type: software | training | content                   │
│   │                                                          │
│   │   SOFTWARE SOLUTION                                      │
│   │   ├── Phases (many) ← Real work units                   │
│   │   │   ├── Builder Assignments                           │
│   │   │   ├── Iterations (prototype versions)               │
│   │   │   │   └── Bug Reports                               │
│   │   │   ├── Deployments                                   │
│   │   │   ├── Payments → Revenue Splits                     │
│   │   │   └── Implementation Users                          │
│   │   └── MoU (one per solution)                            │
│   │                                                          │
│   │   TRAINING SOLUTION                                      │
│   │   ├── Program Details (type, track, dates)              │
│   │   ├── Sessions (many)                                   │
│   │   ├── Cohort Assignments                                │
│   │   └── Payments → Revenue Splits                         │
│   │                                                          │
│   │   CONTENT SOLUTION                                       │
│   │   ├── Order Details (type, quantity, deadline)          │
│   │   ├── Deliverables (many)                               │
│   │   ├── Production Assignments                            │
│   │   └── Payments → Revenue Splits                         │
│   │                                                          │
├── Discovery Visits (site observations)                       │
├── Communications (calls, emails, WhatsApp)                   │
├── Publications (S2P papers) ← linked to solutions/phases     │
└── Referral (if referred by another department)               │

TALENT POOLS (3)
├── Builders (software - Appathon trained)
│   └── Skills (versioned)
├── Cohort Members (training - levels 0-3)
└── Production Learners (content - by division)

FINANCIALS
├── Payments (per phase/session/order)
├── Revenue Split Models (configurable by solution type)
└── Earnings Ledger (individual payouts)

ACCREDITATION
├── Publications → NIRF/NAAC metrics
└── Accreditation Metrics (definitions)
```

---

## Database Schema

### Core Entities

```sql
-- ============================================
-- CLIENTS
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
  source_department_id UUID REFERENCES departments(id),
  source_contact_name VARCHAR(255),

  -- Partner Status
  partner_status TEXT DEFAULT 'standard' CHECK (partner_status IN ('standard', 'yi', 'alumni', 'mou', 'referral')),
  partner_since TIMESTAMPTZ,
  referral_count INTEGER DEFAULT 0,
  partner_discount DECIMAL(3,2) DEFAULT 0.00,

  -- Intent Platform Link
  intent_agency_id UUID, -- References intent_agencies if from Intent

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SOLUTIONS (Unified for all 3 types)
-- ============================================

CREATE TABLE solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_code VARCHAR(30) NOT NULL UNIQUE, -- JKKN-SOL-2026-001

  client_id UUID REFERENCES clients(id) NOT NULL,
  solution_type TEXT NOT NULL CHECK (solution_type IN ('software', 'training', 'content')),

  -- From Intent Platform (if applicable)
  intent_session_id UUID,
  intent_prd_id UUID,

  title VARCHAR(255) NOT NULL,
  problem_statement TEXT,
  description TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled', 'in_amc')),

  -- Ownership
  lead_department_id UUID REFERENCES departments(id) NOT NULL,

  -- Pricing
  base_price DECIMAL(12,2),
  partner_discount_applied DECIMAL(3,2) DEFAULT 0,
  final_price DECIMAL(12,2),

  -- Timeline
  started_date DATE,
  target_completion DATE,
  completed_date DATE,

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SOFTWARE-SPECIFIC: Phases
-- ============================================

CREATE TABLE solution_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,

  phase_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Status (14 steps)
  status TEXT DEFAULT 'prospecting' CHECK (status IN (
    'prospecting', 'discovery', 'prd_writing', 'prototype_building',
    'client_demo', 'revisions', 'approved', 'deploying', 'training',
    'live', 'in_amc', 'completed', 'on_hold', 'cancelled'
  )),

  -- Ownership (can differ from solution for handoffs)
  owner_department_id UUID REFERENCES departments(id) NOT NULL,

  -- URLs
  prd_url VARCHAR(500),
  prototype_url VARCHAR(500),
  production_url VARCHAR(500),

  -- Pricing
  estimated_value DECIMAL(12,2),

  -- Timeline
  started_date DATE,
  target_completion DATE,
  completed_date DATE,

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(solution_id, phase_number)
);

-- ============================================
-- TRAINING-SPECIFIC: Programs & Sessions
-- ============================================

CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE UNIQUE,

  program_type TEXT CHECK (program_type IN (
    'assessment', 'phase1_champion', 'phase2_implementation',
    'phase3_training', 'workshop', 'full_journey', 'custom'
  )),
  track TEXT CHECK (track IN ('track_a', 'track_b')), -- A=community, B=corporate

  participant_count INTEGER,
  location TEXT,
  location_preference TEXT CHECK (location_preference IN ('on_site', 'remote', 'hybrid')),

  scheduled_start DATE,
  scheduled_end DATE,
  actual_start DATE,
  actual_end DATE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,

  session_number INTEGER,
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  google_calendar_event_id TEXT,

  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  attendance_count INTEGER,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CONTENT-SPECIFIC: Orders & Deliverables
-- ============================================

CREATE TABLE content_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE UNIQUE,

  order_type TEXT CHECK (order_type IN (
    'video', 'social_media', 'presentation', 'writing',
    'branding', 'podcast', 'package'
  )),

  quantity INTEGER DEFAULT 1,
  style_preference TEXT,
  brand_guidelines_url TEXT,

  division TEXT CHECK (division IN ('video', 'graphics', 'content', 'education', 'translation', 'research')),

  due_date DATE,
  revision_rounds INTEGER DEFAULT 2,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES content_orders(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'review', 'revision', 'approved', 'rejected'
  )),
  revision_count INTEGER DEFAULT 0,

  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TALENT POOLS
-- ============================================

-- Builders (Software)
CREATE TABLE builders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- MyJKKN user via OAuth

  name TEXT NOT NULL,
  email TEXT,
  department_id UUID REFERENCES departments(id),

  trained_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE builder_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID REFERENCES builders(id) ON DELETE CASCADE,

  skill_name VARCHAR(100) NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  acquired_date DATE,
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(builder_id, skill_name, version)
);

CREATE TABLE builder_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,
  builder_id UUID REFERENCES builders(id),

  role TEXT DEFAULT 'contributor' CHECK (role IN ('lead', 'contributor')),
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'active', 'completed', 'withdrawn')),

  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cohort Members (Training)
CREATE TABLE cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- MyJKKN user via OAuth

  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department_id UUID,

  level INTEGER DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
  track TEXT CHECK (track IN ('track_a', 'track_b', 'both')),

  sessions_observed INTEGER DEFAULT 0,
  sessions_co_led INTEGER DEFAULT 0,
  sessions_led INTEGER DEFAULT 0,

  total_earnings DECIMAL(12,2) DEFAULT 0,

  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cohort_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  cohort_member_id UUID REFERENCES cohort_members(id),

  role TEXT CHECK (role IN ('observer', 'co_lead', 'lead', 'support')),
  assigned_by UUID, -- null if self-claimed

  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  earnings DECIMAL(10,2),
  rating DECIMAL(2,1),

  UNIQUE(session_id, cohort_member_id)
);

-- Production Learners (Content)
CREATE TABLE production_learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- MyJKKN user via OAuth

  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  division TEXT CHECK (division IN ('video', 'graphics', 'content', 'education', 'translation', 'research')),
  skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  orders_completed INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  avg_rating DECIMAL(2,1),

  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE production_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID REFERENCES content_deliverables(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES production_learners(id),

  role TEXT DEFAULT 'contributor' CHECK (role IN ('lead', 'contributor', 'reviewer')),
  assigned_by UUID, -- null if self-claimed

  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  earnings DECIMAL(10,2),
  quality_rating DECIMAL(2,1),

  UNIQUE(deliverable_id, learner_id)
);

-- ============================================
-- DISCOVERY & COMMUNICATION
-- ============================================

CREATE TABLE discovery_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES solutions(id), -- Optional - may result in new solution
  resulted_phase_id UUID REFERENCES solution_phases(id), -- Phase that resulted from visit

  department_id UUID REFERENCES departments(id) NOT NULL,
  visit_date DATE NOT NULL,
  visitors JSONB DEFAULT '[]'::jsonb,
  observations TEXT NOT NULL,
  pain_points JSONB DEFAULT '[]'::jsonb,
  photos_urls JSONB DEFAULT '[]'::jsonb,
  next_steps TEXT,

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES solutions(id),
  phase_id UUID REFERENCES solution_phases(id),

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

-- ============================================
-- SOFTWARE: Iterations, Bugs, Deployments
-- ============================================

CREATE TABLE prototype_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,
  prototype_url VARCHAR(500) NOT NULL,
  changes_made TEXT,
  feedback TEXT,
  demo_date DATE,
  client_approved BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(phase_id, version)
);

CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iteration_id UUID REFERENCES prototype_iterations(id) ON DELETE CASCADE,

  reported_by VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  screenshots_urls JSONB DEFAULT '[]'::jsonb,

  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE phase_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,

  environment TEXT CHECK (environment IN ('staging', 'production')),
  version VARCHAR(20),
  vercel_url VARCHAR(500),
  supabase_project_id VARCHAR(100),
  custom_domain VARCHAR(255),

  deployed_date DATE NOT NULL,
  deployed_by VARCHAR(255) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'deprecated')),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE implementation_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES solution_phases(id) ON DELETE CASCADE,

  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(100),
  user_email VARCHAR(255),
  trained_date DATE,
  trained_by VARCHAR(255),
  usage_status TEXT DEFAULT 'active' CHECK (usage_status IN ('active', 'inactive', 'churned')),
  last_active DATE,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MOUS
-- ============================================

CREATE TABLE solution_mous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mou_number VARCHAR(50) NOT NULL UNIQUE,
  solution_id UUID REFERENCES solutions(id) UNIQUE, -- 1:1 with solution

  deal_value DECIMAL(12,2) NOT NULL,
  amc_value DECIMAL(12,2),
  payment_terms JSONB DEFAULT '{"mou_signing": 40, "deployment": 40, "acceptance": 20}'::jsonb,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'active', 'expired', 'renewed')),
  sent_date DATE,
  signed_date DATE,
  start_date DATE,
  expiry_date DATE,
  mou_document_url VARCHAR(500),

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FINANCIALS
-- ============================================

CREATE TABLE revenue_split_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_type TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  split_config JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed revenue models
INSERT INTO revenue_split_models (solution_type, name, split_config) VALUES
('software', 'Software Solutions', '{"jicate": 40, "department": 40, "institution": 20}'),
('training_track_a', 'Training Track A (Community)', '{"cohort": 60, "council": 20, "infrastructure": 20}'),
('training_track_b', 'Training Track B (Corporate)', '{"cohort": 30, "department": 20, "jicate": 30, "institution": 20}'),
('content', 'Content Production', '{"learners": 60, "council": 20, "infrastructure": 20}');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic link to payment source
  phase_id UUID REFERENCES solution_phases(id),
  program_id UUID REFERENCES training_programs(id),
  order_id UUID REFERENCES content_orders(id),

  amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('advance', 'milestone', 'completion', 'amc', 'mou_signing', 'deployment', 'acceptance')),
  payment_method TEXT,
  reference_number TEXT,

  due_date DATE,
  paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'received', 'overdue', 'failed')),

  -- Split tracking
  split_model_id UUID REFERENCES revenue_split_models(id),
  split_calculated BOOLEAN DEFAULT FALSE,

  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- At least one source required
  CONSTRAINT payment_source CHECK (phase_id IS NOT NULL OR program_id IS NOT NULL OR order_id IS NOT NULL)
);

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
  department_id UUID REFERENCES departments(id),

  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),

  status TEXT DEFAULT 'calculated' CHECK (status IN ('calculated', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,

  referring_department_id UUID REFERENCES departments(id) NOT NULL,
  executing_department_id UUID REFERENCES departments(id) NOT NULL,

  referral_date DATE NOT NULL,
  first_phase_id UUID REFERENCES solution_phases(id), -- Tracks which phase triggered bonus
  bonus_percentage DECIMAL(5,2) DEFAULT 10.00,
  bonus_paid BOOLEAN DEFAULT false,
  bonus_amount DECIMAL(12,2),
  paid_date DATE,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PUBLICATIONS & ACCREDITATION
-- ============================================

CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES solution_phases(id), -- Optional - some are solution-wide

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

CREATE TABLE publication_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,

  -- Polymorphic contributor
  builder_id UUID REFERENCES builders(id),
  cohort_member_id UUID REFERENCES cohort_members(id),
  learner_id UUID, -- General learner reference

  contribution_type VARCHAR(100) NOT NULL,
  credit_type TEXT CHECK (credit_type IN ('coauthor', 'acknowledgment')),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE accreditation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT CHECK (metric_type IN ('nirf', 'naac')),
  metric_code VARCHAR(20) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  description TEXT,
  max_score DECIMAL(8,2),
  calculation_method TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(metric_type, metric_code)
);

-- Seed NIRF metrics
INSERT INTO accreditation_metrics (metric_type, metric_code, metric_name, description, max_score) VALUES
('nirf', 'RP', 'Research and Professional Practice', 'Publications, research projects, patents, consultancy', 100),
('nirf', 'GO', 'Graduation Outcomes', 'Placement, higher studies, entrepreneurship', 100),
('nirf', 'OI', 'Outreach and Inclusivity', 'Regional diversity, women, economically disadvantaged', 100),
('nirf', 'PR', 'Perception', 'Academic peers and employers', 100);

-- Seed NAAC criteria
INSERT INTO accreditation_metrics (metric_type, metric_code, metric_name, description, max_score) VALUES
('naac', 'C1', 'Curricular Aspects', 'Curriculum design, enrichment, feedback', 150),
('naac', 'C2', 'Teaching-Learning and Evaluation', 'Student enrollment, teacher profile', 200),
('naac', 'C3', 'Research, Innovations and Extension', 'Research, consultancy, extension', 250),
('naac', 'C4', 'Infrastructure and Learning Resources', 'Physical and IT infrastructure', 100),
('naac', 'C5', 'Student Support and Progression', 'Scholarships, placements, alumni', 100),
('naac', 'C6', 'Governance, Leadership and Management', 'Vision, strategy, quality assurance', 100),
('naac', 'C7', 'Institutional Values and Best Practices', 'Gender, environment, innovation', 100);

-- ============================================
-- JICATE SESSIONS (Internal booking)
-- ============================================

CREATE TABLE jicate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to solution or phase
  solution_id UUID REFERENCES solutions(id),
  phase_id UUID REFERENCES solution_phases(id),

  session_date DATE NOT NULL,
  session_time TIME,
  duration_hours DECIMAL(4,2),

  booked_by_department_id UUID REFERENCES departments(id) NOT NULL,
  attendees JSONB DEFAULT '[]'::jsonb,
  jicate_facilitator VARCHAR(255),

  session_notes TEXT,
  outcome TEXT CHECK (outcome IN ('completed', 'partial', 'rescheduled', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT session_link CHECK (solution_id IS NOT NULL OR phase_id IS NOT NULL)
);
```

---

## Intent Platform Integration

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTENT → SOLUTIONS HUB FLOW                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: Client Starts Interview (Intent Platform)              │
│  ─────────────────────────────────────────────────              │
│  • Client selects solution type (software/training/content)     │
│  • Interview depth varies:                                       │
│    - Software: 60-100 questions (all 11 territories + agentic)  │
│    - Training: 20-30 questions (all 11 territories + agentic)   │
│    - Content: 10-15 questions (prioritized territories)         │
│                                                                  │
│  STEP 2: Interview Completes                                    │
│  ───────────────────────────                                    │
│  • Software → Full PRD generated                                │
│  • Training → Training Brief generated                          │
│  • Content → Order Brief generated                              │
│                                                                  │
│  STEP 3: Webhook to Solutions Hub                               │
│  ────────────────────────────                                   │
│  • Creates/updates client record                                │
│  • Creates solution record (linked to intent session)           │
│  • Auto-applies partner discount if applicable                  │
│                                                                  │
│  STEP 4: Assignment & Execution                                 │
│  ────────────────────────────                                   │
│  • Software: Phases created, builders assigned                  │
│  • Training: Program created, cohort members claim/assigned     │
│  • Content: Order created, production learners assigned         │
│                                                                  │
│  STEP 5: Completion & Payment                                   │
│  ────────────────────────────                                   │
│  • Deliverables approved (by client or internal)                │
│  • Payment recorded                                             │
│  • Revenue split auto-calculated                                │
│  • Earnings distributed                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Webhook Specification

**Endpoint:** `https://solutions.jkkn.ai/api/webhooks/intent`

**Intent Platform Config Required:**
```env
SOLUTIONS_HUB_WEBHOOK_URL=https://solutions.jkkn.ai/api/webhooks/intent
WEBHOOK_SECRET=<shared-secret>
```

**Webhook Payload:**

```typescript
interface IntentWebhookPayload {
  event: 'interview_complete';
  service_type: 'software' | 'training' | 'content';
  session_id: string;
  agency_id: string;

  client: {
    name: string;
    email: string;
    company: string;
    phone?: string;
  };

  // Software-specific
  prd_id?: string;
  prd_url?: string;

  // Training-specific
  training_details?: {
    type: 'workshop' | 'phase1_champion' | 'full_journey' | 'custom';
    track: 'track_a' | 'track_b';
    participant_count: number;
    location_preference: 'on_site' | 'remote' | 'hybrid';
    scheduled_dates?: string[];
    industry_context?: string;
    ai_readiness_level: 'beginner' | 'intermediate' | 'advanced';
  };
  brief_url?: string;

  // Content-specific
  content_details?: {
    order_type: 'video' | 'social_media' | 'presentation' | 'writing' | 'branding';
    quantity: number;
    style_references?: string[];
    brand_guidelines_url?: string;
    deadline?: string;
    revision_rounds: number;
  };

  pricing: {
    base_price: number;
    partner_discount: number;
    final_price: number;
  };
}
```

**Solutions Hub Handler:**

```typescript
// POST /api/webhooks/intent
export async function POST(req: Request) {
  // 1. Verify webhook secret
  const secret = req.headers.get('X-Webhook-Secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse payload
  const payload: IntentWebhookPayload = await req.json();

  // 3. Idempotency check (prevent duplicate processing)
  const existing = await db.solutions.findFirst({
    where: { intent_session_id: payload.session_id }
  });
  if (existing) {
    return Response.json({ status: 'already_processed', solution_id: existing.id });
  }

  // 4. Create/update client
  const client = await upsertClient(payload.client, payload.agency_id);

  // 5. Create solution with type-specific details
  const solution = await createSolution({
    client_id: client.id,
    solution_type: payload.service_type,
    intent_session_id: payload.session_id,
    intent_prd_id: payload.prd_id,
    base_price: payload.pricing.base_price,
    partner_discount_applied: payload.pricing.partner_discount,
    final_price: payload.pricing.final_price,
  });

  // 6. Create type-specific records
  if (payload.service_type === 'training' && payload.training_details) {
    await createTrainingProgram(solution.id, payload.training_details);
  }
  if (payload.service_type === 'content' && payload.content_details) {
    await createContentOrder(solution.id, payload.content_details);
  }

  return Response.json({ status: 'created', solution_id: solution.id });
}
```

### Intent Platform Update Required

When Solutions Hub is deployed, update Intent Platform:

| File | Change |
|------|--------|
| `.env` | Add `SOLUTIONS_HUB_WEBHOOK_URL=https://solutions.jkkn.ai/api/webhooks/intent` |
| `.env` | Add `WEBHOOK_SECRET=<generate-secure-secret>` |
| `interview-agent.ts` | Uncomment/implement `onInterviewComplete()` webhook call |

### Shared Database

Both Intent Platform and Solutions Hub share the same Supabase project:

| Table | Owned By | Used By |
|-------|----------|---------|
| intent_agencies | Intent Platform | Solutions Hub (read → client creation) |
| intent_sessions | Intent Platform | Solutions Hub (read → solution creation) |
| intent_prds | Intent Platform | Solutions Hub (read) |
| clients | Solutions Hub | Intent Platform (write on complete) |
| solutions | Solutions Hub | Intent Platform (write on complete) |

---

## Self-Service Portals

### Client Portal (External)

| Feature | What Client Can Do |
|---------|-------------------|
| View Solutions | See all my solutions and status |
| Track Progress | See phase/deliverable status |
| Approve Deliverables | Accept/request revision on content |
| View Schedule | See upcoming training sessions |
| Download Files | Get completed deliverables |
| View Invoices | See payment history |
| Start New Solution | Launch Intent interview |

### Cohort Member Portal (Internal)

| Feature | What Member Can Do |
|---------|-------------------|
| View Level | See current level (0-3) and progress |
| Claim Sessions | Browse and claim available sessions |
| View Schedule | Calendar of assigned sessions |
| Track Earnings | Monthly breakdown, pending payouts |
| View Ratings | Feedback from sessions |
| Request Level Up | Apply for certification exam |

### Production Learner Portal (Internal)

| Feature | What Learner Can Do |
|---------|-------------------|
| View Queue | See available orders for their division |
| Claim Orders | Take on deliverables |
| Submit Work | Upload completed files |
| Track Earnings | Monthly breakdown, pending payouts |
| View Ratings | Quality scores from reviews |

### Builder Portal (Internal)

| Feature | What Builder Can Do |
|---------|-------------------|
| View Assignments | My current and past phase assignments |
| Request Phases | Volunteer for new phases |
| Track Skills | See skill progression and versions |
| View Earnings | Revenue share from completed phases |

---

## Revenue Split Logic

### By Solution Type

| Solution Type | JICATE | Department | Institution | Talent | Council | Infra |
|---------------|--------|------------|-------------|--------|---------|-------|
| **Software** | 40% | 40% | 20% | — | — | — |
| **Training (Track A)** | — | — | — | 60% | 20% | 20% |
| **Training (Track B)** | 30% | 20% | 20% | 30% | — | — |
| **Content** | — | — | — | 60% | 20% | 20% |

### Referral Bonus (Software Only)

- 10% from department share
- Only on **first phase** payment
- When referring dept ≠ executing dept

### Auto-Calculation

```sql
-- Trigger on payment with amount received
CREATE OR REPLACE FUNCTION calculate_revenue_splits()
RETURNS TRIGGER AS $$
-- Get solution type and applicable split model
-- Generate earnings_ledger entries
-- Handle referral bonus for software first phase
$$;
```

---

## Partner Pricing Logic

### Auto-Detection

| Partner Status | Discount | Auto-Trigger |
|----------------|----------|--------------|
| Yi | 50% | Yi membership verified |
| Alumni | 50% | Alumni status verified |
| MoU | 50% | Existing MoU partner |
| Referral | 50% | referral_count >= 2 |
| Standard | 0% | Default |

### Auto-Apply

When solution is created:
1. Check client's partner_status
2. If partner, calculate partner_discount
3. Apply to final_price automatically

---

## Dashboards

### Master Dashboard (MD View)

| Widget | Data |
|--------|------|
| Revenue This Month | Sum of all payments |
| By Solution Type | Pie: Software / Training / Content |
| Active Solutions | Count by status |
| Department Leaderboard | Ranked by revenue sourced |
| Today's Sessions | JICATE + Training sessions |
| Pending Deliverables | Content needing approval |
| Partner Pipeline | Clients at referral_count = 1 |
| NIRF Metrics | Publications count by category |

### Department Dashboard

| Widget | Data |
|--------|------|
| My Clients | Clients sourced by this department |
| My Revenue Share | 40% of payments from my clients |
| Active Phases | Phases I own |
| My Cohort Members | Members from this department |
| Leaderboard Position | My rank vs other departments |

### JICATE Dashboard

| Widget | Data |
|--------|------|
| Today's Sessions | Bookings for today |
| Active Phases | All software phases in progress |
| Builder Utilization | Who's working on what |
| Pipeline Value | Total estimated value of active work |

---

## API Endpoints

### Core CRUD

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | /clients | List/Create clients |
| GET/PUT | /clients/:id | Get/Update client |
| GET/POST | /solutions | List/Create solutions |
| GET/PUT | /solutions/:id | Get/Update solution |
| GET/POST | /solutions/:id/phases | List/Create phases |
| GET/PUT | /phases/:id | Get/Update phase |

### Training

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /training-programs | List programs |
| POST | /training-programs/:id/sessions | Add session |
| POST | /training-sessions/:id/claim | Cohort member claims |
| PATCH | /training-sessions/:id/assign | Admin assigns |

### Content

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /content-orders | List orders |
| POST | /content-orders/:id/deliverables | Add deliverable |
| POST | /content-deliverables/:id/claim | Learner claims |
| PATCH | /content-deliverables/:id/approve | Client approves |

### Financials

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /payments | Record payment |
| GET | /earnings/:type/:id | Get earnings for entity |
| GET | /revenue-report | Generate revenue report |

### Accreditation

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /accreditation/nirf | NIRF metrics |
| GET | /accreditation/naac | NAAC criteria |
| GET | /accreditation/nirf/export | Generate NIRF report |
| GET | /accreditation/naac/export | Generate NAAC report |

---

## Business Rules (From Interview)

### Disputes & Revisions

| Rule | Policy |
|------|--------|
| **Client approval** | Client always wins on deliverable disputes |
| **Revision limit** | Soft limit with visibility (track count, flag excessive to MD, don't hard-stop) |
| **Excessive revisions** | System flags when revision_count > 3, MD can intervene if needed |

### Talent Departures

| Scenario | Policy |
|----------|--------|
| Leaves mid-project | **Forfeit if incomplete** |
| Completed work | Paid for completed phases/deliverables |
| Unpaid earnings | Only paid if milestone was completed before departure |

### Notifications

| Channel | Usage |
|---------|-------|
| **In-app only** | All notifications (no WhatsApp/email integration) |
| Dashboard alerts | Pending items, deadlines, approvals needed |

### Critical Timeline

| Milestone | Urgency |
|-----------|---------|
| **NIRF/NAAC visit** | **3 months** - accreditation reporting is critical |
| System launch | ASAP - blocking other work |
| User count at launch | 50+ users (broad rollout from day 1) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) - NEW project |
| Auth | MyJKKN OAuth (Google) + Supabase Auth (email/password) |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| Notifications | In-app only (no external integrations) |

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Supabase project setup (shared with Intent)
- [ ] MyJKKN OAuth integration
- [ ] Client signup/login flow
- [ ] Client management (with partner status)
- [ ] Solution CRUD (unified for all 3 types)

### Phase 2: Software Module (Week 2-3)

- [ ] Phase management
- [ ] Builder management + skills
- [ ] Builder assignments workflow
- [ ] Iterations + bug tracking
- [ ] Deployments tracking
- [ ] MoU management

### Phase 3: Training Module (Week 3-4)

- [ ] Training programs CRUD
- [ ] Training sessions CRUD
- [ ] Cohort members management
- [ ] Claim/assign flow
- [ ] Cohort member dashboard

### Phase 4: Content Module (Week 4-5)

- [ ] Content orders CRUD
- [ ] Deliverables management
- [ ] Production learners management
- [ ] Claim/assign flow
- [ ] Production learner dashboard

### Phase 5: Financials (Week 5-6)

- [ ] Payment recording
- [ ] Auto split calculation
- [ ] Earnings ledger
- [ ] Partner pricing automation
- [ ] Financial dashboards

### Phase 6: Discovery & Communication (Week 6-7)

- [ ] Discovery visits CRUD
- [ ] Client communications (manual)
- [ ] WhatsApp sync integration
- [ ] Email sync integration

### Phase 7: Publications & Accreditation (Week 7-8)

- [ ] Publications CRUD
- [ ] Publication contributors
- [ ] NIRF report generation
- [ ] NAAC report generation

### Phase 8: Integration & Polish (Week 8-9)

- [ ] Intent Platform webhook
- [ ] Google Calendar sync
- [ ] Email notifications
- [ ] Master dashboard
- [ ] Testing & fixes

---

## Success Metrics (30-Day Goals from Interview)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Zero status calls** | MD receives 0 "what's the status" queries | Self-service working |
| **Payments flowing** | All payments recorded, splits auto-calculated | No manual Excel |
| **Department adoption** | All 9 institutions actively using | Accountability visible |
| **Client satisfaction** | Clients using portal, positive feedback | Trust established |

### System Metrics

| Metric | Target |
|--------|--------|
| Time to create solution | < 2 minutes (from Intent completion) |
| Time to generate invoice with partner discount | < 30 seconds |
| Cohort member self-service | 100% (no manual work for claiming) |
| Production learner self-service | 100% |
| Client can track own solutions | Yes, via portal |
| MD can see all solutions in one view | Single dashboard |
| Department can see revenue attribution | Self-service |
| Time to generate NIRF/NAAC report | < 5 minutes |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **System downtime (worst fear)** | Client portal must be highly reliable - client demo fails = embarrassment |
| **Uptime target** | 99.5%+ for client-facing pages |
| **Fallback** | Static status page if system is down |

---

## Deprecated Documents

This specification supersedes:

| Document | Location | Status |
|----------|----------|--------|
| Solutions Management PRD | `../Solutions-Management/PRD.md` | **Archived** |
| Solutions Management Tech Spec | `../Solutions-Management/handoff/TECHNICAL-SPEC.md` | **Archived** |
| AI-Services-Extension-PRD | `../Solutions-Management/AI-Services-Extension-PRD.md` | **Deleted** |
| JICATE-Services-Hub SPECS | `./SPECS.md` | **Replaced by this file** |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-02-01 | **MERGED SPEC** - Combined Solutions Management + Services Hub into unified JKKN Solutions Hub |

---

*Created: 2026-02-01*
*Status: Ready for Implementation*
*Aligned with: JKKN Vision - "To be a Leading Global Innovative Solutions provider"*
