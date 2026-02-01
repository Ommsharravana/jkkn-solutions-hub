/**
 * JKKN Solutions Hub - Database Types
 * Auto-generated from Supabase schema
 */

// ============================================
// ENUMS
// ============================================

export type SourceType = 'placement' | 'alumni' | 'clinical' | 'referral' | 'direct' | 'yi' | 'intent';
export type PartnerStatus = 'standard' | 'yi' | 'alumni' | 'mou' | 'referral';
export type SolutionType = 'software' | 'training' | 'content';
export type SolutionStatus = 'active' | 'on_hold' | 'completed' | 'cancelled' | 'in_amc';

export type PhaseStatus =
  | 'prospecting' | 'discovery' | 'prd_writing' | 'prototype_building'
  | 'client_demo' | 'revisions' | 'approved' | 'deploying' | 'training'
  | 'live' | 'in_amc' | 'completed' | 'on_hold' | 'cancelled';

export type BuilderRole = 'lead' | 'contributor';
export type AssignmentStatus = 'requested' | 'approved' | 'active' | 'completed' | 'withdrawn';
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';
export type DeploymentEnvironment = 'staging' | 'production';
export type DeploymentStatus = 'active' | 'maintenance' | 'deprecated';
export type UsageStatus = 'active' | 'inactive' | 'churned';
export type MouStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'renewed';

export type ProgramType =
  | 'assessment' | 'phase1_champion' | 'phase2_implementation'
  | 'phase3_training' | 'workshop' | 'full_journey' | 'custom';
export type TrainingTrack = 'track_a' | 'track_b';
export type LocationPreference = 'on_site' | 'remote' | 'hybrid';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type CohortTrack = 'track_a' | 'track_b' | 'both';
export type CohortRole = 'observer' | 'co_lead' | 'lead' | 'support';

export type ContentOrderType =
  | 'video' | 'social_media' | 'presentation' | 'writing'
  | 'branding' | 'podcast' | 'package';
export type ContentDivision = 'video' | 'graphics' | 'content' | 'education' | 'translation' | 'research';
export type DeliverableStatus = 'pending' | 'in_progress' | 'review' | 'revision' | 'approved' | 'rejected';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ProductionRole = 'lead' | 'contributor' | 'reviewer';

export type CommunicationType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';
export type CommunicationSource = 'manual' | 'whatsapp_sync' | 'gmail_sync';
export type CommunicationDirection = 'inbound' | 'outbound';

export type PaymentType = 'advance' | 'milestone' | 'completion' | 'amc' | 'mou_signing' | 'deployment' | 'acceptance';
export type PaymentStatus = 'pending' | 'invoiced' | 'received' | 'overdue' | 'failed';
export type RecipientType =
  | 'builder' | 'cohort_member' | 'production_learner'
  | 'department' | 'jicate' | 'institution' | 'council' | 'infrastructure'
  | 'referral_bonus';
export type EarningsStatus = 'calculated' | 'approved' | 'paid';

export type PaperType = 'problem' | 'design' | 'technical' | 'data' | 'impact';
export type JournalType = 'scopus' | 'ugc_care' | 'other';
export type PublicationStatus =
  | 'identified' | 'drafting' | 'submitted' | 'under_review'
  | 'revision' | 'accepted' | 'published' | 'rejected';
export type CreditType = 'coauthor' | 'acknowledgment';
export type MetricType = 'nirf' | 'naac';

export type JicateSessionOutcome = 'completed' | 'partial' | 'rescheduled' | 'cancelled';

// ============================================
// CORE ENTITIES
// ============================================

export interface Department {
  id: string;
  name: string;
  code: string;
  institution: string;
  hod_name: string | null;
  hod_email: string | null;
  hod_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string | null;
  address: string | null;
  city: string | null;
  company_size: string | null;
  source_type: SourceType | null;
  source_department_id: string | null;
  source_contact_name: string | null;
  partner_status: PartnerStatus;
  partner_since: string | null;
  referral_count: number;
  partner_discount: number;
  intent_agency_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Solution {
  id: string;
  solution_code: string;
  client_id: string;
  solution_type: SolutionType;
  intent_session_id: string | null;
  intent_prd_id: string | null;
  title: string;
  problem_statement: string | null;
  description: string | null;
  status: SolutionStatus;
  lead_department_id: string;
  base_price: number | null;
  partner_discount_applied: number;
  final_price: number | null;
  started_date: string | null;
  target_completion: string | null;
  completed_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// SOFTWARE MODULE
// ============================================

export interface SolutionPhase {
  id: string;
  solution_id: string;
  phase_number: number;
  title: string;
  description: string | null;
  status: PhaseStatus;
  owner_department_id: string;
  prd_url: string | null;
  prototype_url: string | null;
  production_url: string | null;
  estimated_value: number | null;
  started_date: string | null;
  target_completion: string | null;
  completed_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Builder {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  department_id: string | null;
  trained_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BuilderSkill {
  id: string;
  builder_id: string;
  skill_name: string;
  proficiency_level: number | null;
  acquired_date: string | null;
  version: number;
  created_at: string;
}

export interface BuilderAssignment {
  id: string;
  phase_id: string;
  builder_id: string;
  role: BuilderRole;
  status: AssignmentStatus;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PrototypeIteration {
  id: string;
  phase_id: string;
  version: number;
  prototype_url: string;
  changes_made: string | null;
  feedback: string | null;
  demo_date: string | null;
  client_approved: boolean | null;
  created_at: string;
}

export interface BugReport {
  id: string;
  iteration_id: string;
  reported_by: string;
  description: string;
  severity: BugSeverity | null;
  screenshots_urls: string[];
  status: BugStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface PhaseDeployment {
  id: string;
  phase_id: string;
  environment: DeploymentEnvironment | null;
  version: string | null;
  vercel_url: string | null;
  supabase_project_id: string | null;
  custom_domain: string | null;
  deployed_date: string;
  deployed_by: string;
  status: DeploymentStatus;
  created_at: string;
}

export interface ImplementationUser {
  id: string;
  phase_id: string;
  user_name: string;
  user_role: string | null;
  user_email: string | null;
  trained_date: string | null;
  trained_by: string | null;
  usage_status: UsageStatus;
  last_active: string | null;
  created_at: string;
}

export interface SolutionMou {
  id: string;
  mou_number: string;
  solution_id: string;
  deal_value: number;
  amc_value: number | null;
  payment_terms: {
    mou_signing: number;
    deployment: number;
    acceptance: number;
  };
  status: MouStatus;
  sent_date: string | null;
  signed_date: string | null;
  start_date: string | null;
  expiry_date: string | null;
  mou_document_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// TRAINING MODULE
// ============================================

export interface TrainingProgram {
  id: string;
  solution_id: string;
  program_type: ProgramType | null;
  track: TrainingTrack | null;
  participant_count: number | null;
  location: string | null;
  location_preference: LocationPreference | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  program_id: string;
  session_number: number | null;
  title: string | null;
  scheduled_at: string | null;
  duration_minutes: number;
  location: string | null;
  google_calendar_event_id: string | null;
  status: SessionStatus;
  attendance_count: number | null;
  notes: string | null;
  created_at: string;
}

export interface CohortMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
  level: number;
  track: CohortTrack | null;
  sessions_observed: number;
  sessions_co_led: number;
  sessions_led: number;
  total_earnings: number;
  status: string;
  joined_at: string;
  updated_at: string;
}

export interface CohortAssignment {
  id: string;
  session_id: string;
  cohort_member_id: string;
  role: CohortRole | null;
  assigned_by: string | null;
  assigned_at: string;
  completed_at: string | null;
  earnings: number | null;
  rating: number | null;
}

// ============================================
// CONTENT MODULE
// ============================================

export interface ContentOrder {
  id: string;
  solution_id: string;
  order_type: ContentOrderType | null;
  quantity: number;
  style_preference: string | null;
  brand_guidelines_url: string | null;
  division: ContentDivision | null;
  due_date: string | null;
  revision_rounds: number;
  created_at: string;
  updated_at: string;
}

export interface ContentDeliverable {
  id: string;
  order_id: string;
  title: string;
  file_url: string | null;
  file_type: string | null;
  status: DeliverableStatus;
  revision_count: number;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProductionLearner {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  division: ContentDivision | null;
  skill_level: SkillLevel;
  orders_completed: number;
  total_earnings: number;
  avg_rating: number | null;
  status: string;
  joined_at: string;
}

export interface ProductionAssignment {
  id: string;
  deliverable_id: string;
  learner_id: string;
  role: ProductionRole;
  assigned_by: string | null;
  assigned_at: string;
  completed_at: string | null;
  earnings: number | null;
  quality_rating: number | null;
}

// ============================================
// DISCOVERY & COMMUNICATIONS
// ============================================

export interface DiscoveryVisit {
  id: string;
  client_id: string;
  solution_id: string | null;
  resulted_phase_id: string | null;
  department_id: string;
  visit_date: string;
  visitors: Array<{ name: string; role?: string }>;
  observations: string;
  pain_points: string[];
  photos_urls: string[];
  next_steps: string | null;
  created_by: string;
  created_at: string;
}

export interface ClientCommunication {
  id: string;
  client_id: string;
  solution_id: string | null;
  phase_id: string | null;
  communication_type: CommunicationType | null;
  source: CommunicationSource;
  direction: CommunicationDirection | null;
  subject: string | null;
  summary: string;
  participants: Array<{ name: string; role?: string }>;
  external_id: string | null;
  attachments_urls: string[];
  communication_date: string;
  recorded_by: string | null;
  created_at: string;
}

// ============================================
// FINANCIALS
// ============================================

export interface RevenueSplitModel {
  id: string;
  solution_type: string;
  name: string;
  split_config: Record<string, number>;
  created_at: string;
}

export interface Payment {
  id: string;
  phase_id: string | null;
  program_id: string | null;
  order_id: string | null;
  amount: number;
  payment_type: PaymentType | null;
  payment_method: string | null;
  reference_number: string | null;
  due_date: string | null;
  paid_at: string | null;
  status: PaymentStatus;
  split_model_id: string | null;
  split_calculated: boolean;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EarningsLedger {
  id: string;
  payment_id: string;
  recipient_type: RecipientType | null;
  recipient_id: string | null;
  recipient_name: string | null;
  department_id: string | null;
  amount: number;
  percentage: number | null;
  status: EarningsStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ClientReferral {
  id: string;
  client_id: string;
  referring_department_id: string;
  executing_department_id: string;
  referral_date: string;
  first_phase_id: string | null;
  bonus_percentage: number;
  bonus_paid: boolean;
  bonus_amount: number | null;
  paid_date: string | null;
  created_at: string;
}

// ============================================
// ACCREDITATION
// ============================================

export interface Publication {
  id: string;
  solution_id: string;
  phase_id: string | null;
  paper_type: PaperType | null;
  title: string;
  authors: Array<{ name: string; affiliation?: string }>;
  abstract: string | null;
  journal_name: string | null;
  journal_type: JournalType | null;
  status: PublicationStatus;
  submitted_date: string | null;
  published_date: string | null;
  doi: string | null;
  url: string | null;
  nirf_category: string | null;
  naac_criterion: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationContributor {
  id: string;
  publication_id: string;
  builder_id: string | null;
  cohort_member_id: string | null;
  learner_id: string | null;
  contribution_type: string;
  credit_type: CreditType | null;
  created_at: string;
}

export interface AccreditationMetric {
  id: string;
  metric_type: MetricType | null;
  metric_code: string;
  metric_name: string;
  description: string | null;
  max_score: number | null;
  calculation_method: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// JICATE SESSIONS
// ============================================

export interface JicateSession {
  id: string;
  solution_id: string | null;
  phase_id: string | null;
  session_date: string;
  session_time: string | null;
  duration_hours: number | null;
  booked_by_department_id: string;
  attendees: Array<{ name: string; role?: string }>;
  jicate_facilitator: string | null;
  session_notes: string | null;
  outcome: JicateSessionOutcome | null;
  created_at: string;
}

// ============================================
// DATABASE TYPE (Supabase format)
// ============================================

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: Department;
        Insert: Omit<Department, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Department, 'id' | 'created_at'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'referral_count' | 'partner_discount'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          referral_count?: number;
          partner_discount?: number;
        };
        Update: Partial<Omit<Client, 'id' | 'created_at'>>;
      };
      solutions: {
        Row: Solution;
        Insert: Omit<Solution, 'id' | 'solution_code' | 'created_at' | 'updated_at' | 'partner_discount_applied'> & {
          id?: string;
          solution_code?: string;
          created_at?: string;
          updated_at?: string;
          partner_discount_applied?: number;
        };
        Update: Partial<Omit<Solution, 'id' | 'solution_code' | 'created_at'>>;
      };
      solution_phases: {
        Row: SolutionPhase;
        Insert: Omit<SolutionPhase, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SolutionPhase, 'id' | 'created_at'>>;
      };
      builders: {
        Row: Builder;
        Insert: Omit<Builder, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: Partial<Omit<Builder, 'id' | 'created_at'>>;
      };
      builder_skills: {
        Row: BuilderSkill;
        Insert: Omit<BuilderSkill, 'id' | 'created_at' | 'version'> & {
          id?: string;
          created_at?: string;
          version?: number;
        };
        Update: Partial<Omit<BuilderSkill, 'id' | 'created_at'>>;
      };
      builder_assignments: {
        Row: BuilderAssignment;
        Insert: Omit<BuilderAssignment, 'id' | 'created_at' | 'requested_at' | 'role' | 'status'> & {
          id?: string;
          created_at?: string;
          requested_at?: string;
          role?: BuilderRole;
          status?: AssignmentStatus;
        };
        Update: Partial<Omit<BuilderAssignment, 'id' | 'created_at'>>;
      };
      prototype_iterations: {
        Row: PrototypeIteration;
        Insert: Omit<PrototypeIteration, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PrototypeIteration, 'id' | 'created_at'>>;
      };
      bug_reports: {
        Row: BugReport;
        Insert: Omit<BugReport, 'id' | 'created_at' | 'status' | 'screenshots_urls'> & {
          id?: string;
          created_at?: string;
          status?: BugStatus;
          screenshots_urls?: string[];
        };
        Update: Partial<Omit<BugReport, 'id' | 'created_at'>>;
      };
      phase_deployments: {
        Row: PhaseDeployment;
        Insert: Omit<PhaseDeployment, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: DeploymentStatus;
        };
        Update: Partial<Omit<PhaseDeployment, 'id' | 'created_at'>>;
      };
      implementation_users: {
        Row: ImplementationUser;
        Insert: Omit<ImplementationUser, 'id' | 'created_at' | 'usage_status'> & {
          id?: string;
          created_at?: string;
          usage_status?: UsageStatus;
        };
        Update: Partial<Omit<ImplementationUser, 'id' | 'created_at'>>;
      };
      solution_mous: {
        Row: SolutionMou;
        Insert: Omit<SolutionMou, 'id' | 'created_at' | 'updated_at' | 'status' | 'payment_terms'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: MouStatus;
          payment_terms?: { mou_signing: number; deployment: number; acceptance: number };
        };
        Update: Partial<Omit<SolutionMou, 'id' | 'created_at'>>;
      };
      training_programs: {
        Row: TrainingProgram;
        Insert: Omit<TrainingProgram, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TrainingProgram, 'id' | 'created_at'>>;
      };
      training_sessions: {
        Row: TrainingSession;
        Insert: Omit<TrainingSession, 'id' | 'created_at' | 'status' | 'duration_minutes'> & {
          id?: string;
          created_at?: string;
          status?: SessionStatus;
          duration_minutes?: number;
        };
        Update: Partial<Omit<TrainingSession, 'id' | 'created_at'>>;
      };
      cohort_members: {
        Row: CohortMember;
        Insert: Omit<CohortMember, 'id' | 'joined_at' | 'updated_at' | 'level' | 'sessions_observed' | 'sessions_co_led' | 'sessions_led' | 'total_earnings' | 'status'> & {
          id?: string;
          joined_at?: string;
          updated_at?: string;
          level?: number;
          sessions_observed?: number;
          sessions_co_led?: number;
          sessions_led?: number;
          total_earnings?: number;
          status?: string;
        };
        Update: Partial<Omit<CohortMember, 'id' | 'joined_at'>>;
      };
      cohort_assignments: {
        Row: CohortAssignment;
        Insert: Omit<CohortAssignment, 'id' | 'assigned_at'> & {
          id?: string;
          assigned_at?: string;
        };
        Update: Partial<Omit<CohortAssignment, 'id'>>;
      };
      content_orders: {
        Row: ContentOrder;
        Insert: Omit<ContentOrder, 'id' | 'created_at' | 'updated_at' | 'quantity' | 'revision_rounds'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          quantity?: number;
          revision_rounds?: number;
        };
        Update: Partial<Omit<ContentOrder, 'id' | 'created_at'>>;
      };
      content_deliverables: {
        Row: ContentDeliverable;
        Insert: Omit<ContentDeliverable, 'id' | 'created_at' | 'status' | 'revision_count'> & {
          id?: string;
          created_at?: string;
          status?: DeliverableStatus;
          revision_count?: number;
        };
        Update: Partial<Omit<ContentDeliverable, 'id' | 'created_at'>>;
      };
      production_learners: {
        Row: ProductionLearner;
        Insert: Omit<ProductionLearner, 'id' | 'joined_at' | 'skill_level' | 'orders_completed' | 'total_earnings' | 'status'> & {
          id?: string;
          joined_at?: string;
          skill_level?: SkillLevel;
          orders_completed?: number;
          total_earnings?: number;
          status?: string;
        };
        Update: Partial<Omit<ProductionLearner, 'id' | 'joined_at'>>;
      };
      production_assignments: {
        Row: ProductionAssignment;
        Insert: Omit<ProductionAssignment, 'id' | 'assigned_at' | 'role'> & {
          id?: string;
          assigned_at?: string;
          role?: ProductionRole;
        };
        Update: Partial<Omit<ProductionAssignment, 'id'>>;
      };
      discovery_visits: {
        Row: DiscoveryVisit;
        Insert: Omit<DiscoveryVisit, 'id' | 'created_at' | 'visitors' | 'pain_points' | 'photos_urls'> & {
          id?: string;
          created_at?: string;
          visitors?: Array<{ name: string; role?: string }>;
          pain_points?: string[];
          photos_urls?: string[];
        };
        Update: Partial<Omit<DiscoveryVisit, 'id' | 'created_at'>>;
      };
      client_communications: {
        Row: ClientCommunication;
        Insert: Omit<ClientCommunication, 'id' | 'created_at' | 'communication_date' | 'source' | 'participants' | 'attachments_urls'> & {
          id?: string;
          created_at?: string;
          communication_date?: string;
          source?: CommunicationSource;
          participants?: Array<{ name: string; role?: string }>;
          attachments_urls?: string[];
        };
        Update: Partial<Omit<ClientCommunication, 'id' | 'created_at'>>;
      };
      revenue_split_models: {
        Row: RevenueSplitModel;
        Insert: Omit<RevenueSplitModel, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<RevenueSplitModel, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'status' | 'split_calculated'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: PaymentStatus;
          split_calculated?: boolean;
        };
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>;
      };
      earnings_ledger: {
        Row: EarningsLedger;
        Insert: Omit<EarningsLedger, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: EarningsStatus;
        };
        Update: Partial<Omit<EarningsLedger, 'id' | 'created_at'>>;
      };
      client_referrals: {
        Row: ClientReferral;
        Insert: Omit<ClientReferral, 'id' | 'created_at' | 'bonus_percentage' | 'bonus_paid'> & {
          id?: string;
          created_at?: string;
          bonus_percentage?: number;
          bonus_paid?: boolean;
        };
        Update: Partial<Omit<ClientReferral, 'id' | 'created_at'>>;
      };
      publications: {
        Row: Publication;
        Insert: Omit<Publication, 'id' | 'created_at' | 'updated_at' | 'status' | 'authors'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: PublicationStatus;
          authors?: Array<{ name: string; affiliation?: string }>;
        };
        Update: Partial<Omit<Publication, 'id' | 'created_at'>>;
      };
      publication_contributors: {
        Row: PublicationContributor;
        Insert: Omit<PublicationContributor, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PublicationContributor, 'id' | 'created_at'>>;
      };
      accreditation_metrics: {
        Row: AccreditationMetric;
        Insert: Omit<AccreditationMetric, 'id' | 'created_at' | 'is_active'> & {
          id?: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: Partial<Omit<AccreditationMetric, 'id' | 'created_at'>>;
      };
      jicate_sessions: {
        Row: JicateSession;
        Insert: Omit<JicateSession, 'id' | 'created_at' | 'attendees'> & {
          id?: string;
          created_at?: string;
          attendees?: Array<{ name: string; role?: string }>;
        };
        Update: Partial<Omit<JicateSession, 'id' | 'created_at'>>;
      };
    };
  };
}
