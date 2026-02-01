-- ============================================
-- 011: SEED DATA
-- Revenue split models and accreditation metrics
-- ============================================

-- ============================================
-- REVENUE SPLIT MODELS
-- ============================================

INSERT INTO revenue_split_models (solution_type, name, split_config) VALUES
('software', 'Software Solutions', '{"jicate": 40, "department": 40, "institution": 20}'::jsonb),
('training_track_a', 'Training Track A (Community)', '{"cohort": 60, "council": 20, "infrastructure": 20}'::jsonb),
('training_track_b', 'Training Track B (Corporate)', '{"cohort": 30, "department": 20, "jicate": 30, "institution": 20}'::jsonb),
('content', 'Content Production', '{"learners": 60, "council": 20, "infrastructure": 20}'::jsonb);

-- ============================================
-- NIRF METRICS
-- ============================================

INSERT INTO accreditation_metrics (metric_type, metric_code, metric_name, description, max_score) VALUES
('nirf', 'RP', 'Research and Professional Practice', 'Publications, research projects, patents, consultancy', 100),
('nirf', 'GO', 'Graduation Outcomes', 'Placement, higher studies, entrepreneurship', 100),
('nirf', 'OI', 'Outreach and Inclusivity', 'Regional diversity, women, economically disadvantaged', 100),
('nirf', 'PR', 'Perception', 'Academic peers and employers', 100);

-- ============================================
-- NAAC CRITERIA
-- ============================================

INSERT INTO accreditation_metrics (metric_type, metric_code, metric_name, description, max_score) VALUES
('naac', 'C1', 'Curricular Aspects', 'Curriculum design, enrichment, feedback', 150),
('naac', 'C2', 'Teaching-Learning and Evaluation', 'Student enrollment, teacher profile', 200),
('naac', 'C3', 'Research, Innovations and Extension', 'Research, consultancy, extension', 250),
('naac', 'C4', 'Infrastructure and Learning Resources', 'Physical and IT infrastructure', 100),
('naac', 'C5', 'Student Support and Progression', 'Scholarships, placements, alumni', 100),
('naac', 'C6', 'Governance, Leadership and Management', 'Vision, strategy, quality assurance', 100),
('naac', 'C7', 'Institutional Values and Best Practices', 'Gender, environment, innovation', 100);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE revenue_split_models IS 'Pre-configured revenue split models. Software=40-40-20, Training varies by track, Content=60-20-20';
