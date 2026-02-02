-- ============================================
-- 017: NOTIFICATION TRIGGERS
-- Automatic notifications for key business events
-- ============================================

-- ============================================
-- SCHEMA UPDATES
-- ============================================

-- Add metadata column to notifications (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Expand notification types to include trigger-specific types
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  -- Original types
  'approval', 'deadline', 'flag', 'system', 'assignment', 'payment',
  -- Trigger-specific types (more granular)
  'payment_received', 'deliverable_approved', 'deliverable_rejected',
  'deliverable_revision', 'assignment_requested', 'assignment_approved',
  'mou_signed', 'mou_expiring', 'level_up_request'
));

-- ============================================
-- 1. PAYMENT RECEIVED TRIGGER
-- Notifies: Solution creator
-- ============================================

CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  v_solution RECORD;
  v_phase_id UUID;
  v_program_id UUID;
  v_order_id UUID;
  v_solution_id UUID;
BEGIN
  -- Only trigger when status changes to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN

    -- Determine source type and get solution
    IF NEW.phase_id IS NOT NULL THEN
      SELECT sp.solution_id INTO v_solution_id
      FROM solution_phases sp
      WHERE sp.id = NEW.phase_id;
    ELSIF NEW.program_id IS NOT NULL THEN
      SELECT tp.solution_id INTO v_solution_id
      FROM training_programs tp
      WHERE tp.id = NEW.program_id;
    ELSIF NEW.order_id IS NOT NULL THEN
      SELECT co.solution_id INTO v_solution_id
      FROM content_orders co
      WHERE co.id = NEW.order_id;
    END IF;

    IF v_solution_id IS NOT NULL THEN
      -- Get solution details
      SELECT id, title, solution_code, created_by, lead_department_id
      INTO v_solution
      FROM solutions
      WHERE id = v_solution_id;

      -- Notify solution creator
      IF v_solution.created_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          v_solution.created_by,
          'payment_received',
          'Payment Received',
          format('Payment of Rs.%s received for %s',
            to_char(NEW.amount, 'FM99,99,99,999'),
            COALESCE(v_solution.title, v_solution.solution_code)
          ),
          format('/solutions/%s', v_solution.id),
          jsonb_build_object(
            'payment_id', NEW.id,
            'amount', NEW.amount,
            'solution_id', v_solution.id,
            'solution_code', v_solution.solution_code
          )
        );
      END IF;

      -- Notify MD/CAIO for all payments
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      SELECT
        u.id,
        'payment_received',
        'Payment Received',
        format('Payment of Rs.%s received for %s',
          to_char(NEW.amount, 'FM99,99,99,999'),
          COALESCE(v_solution.title, v_solution.solution_code)
        ),
        format('/solutions/%s', v_solution.id),
        jsonb_build_object(
          'payment_id', NEW.id,
          'amount', NEW.amount,
          'solution_id', v_solution.id,
          'solution_code', v_solution.solution_code
        )
      FROM users u
      WHERE u.role = 'md_caio'
        AND u.is_active = true
        AND u.id != COALESCE(v_solution.created_by, '00000000-0000-0000-0000-000000000000'::UUID);

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on payments table
DROP TRIGGER IF EXISTS payment_received_trigger ON payments;
CREATE TRIGGER payment_received_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- Also trigger on insert with 'received' status
DROP TRIGGER IF EXISTS payment_received_insert_trigger ON payments;
CREATE TRIGGER payment_received_insert_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'received')
  EXECUTE FUNCTION notify_payment_received();

-- ============================================
-- 2. DELIVERABLE STATUS TRIGGER
-- Notifies: Production learner when their work is approved/rejected
-- ============================================

CREATE OR REPLACE FUNCTION notify_deliverable_status()
RETURNS TRIGGER AS $$
DECLARE
  v_learner RECORD;
  v_order RECORD;
  v_solution RECORD;
  v_status_title TEXT;
  v_status_message TEXT;
BEGIN
  -- Only trigger on status changes to approved, rejected, or revision
  IF NEW.status IN ('approved', 'rejected', 'revision')
     AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN

    -- Set notification titles based on status
    CASE NEW.status
      WHEN 'approved' THEN
        v_status_title := 'Work Approved!';
        v_status_message := 'approved';
      WHEN 'rejected' THEN
        v_status_title := 'Work Rejected';
        v_status_message := 'rejected';
      WHEN 'revision' THEN
        v_status_title := 'Revision Required';
        v_status_message := 'needs revision';
    END CASE;

    -- Get solution info through order
    SELECT co.id, co.solution_id INTO v_order
    FROM content_orders co
    WHERE co.id = NEW.order_id;

    IF v_order.solution_id IS NOT NULL THEN
      SELECT id, title, solution_code INTO v_solution
      FROM solutions
      WHERE id = v_order.solution_id;
    END IF;

    -- Notify all assigned production learners
    FOR v_learner IN
      SELECT pl.id, pl.user_id, pl.name
      FROM production_assignments pa
      JOIN production_learners pl ON pl.id = pa.learner_id
      WHERE pa.deliverable_id = NEW.id
        AND pl.user_id IS NOT NULL
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        v_learner.user_id,
        'deliverable_' || NEW.status,
        v_status_title,
        format('Your deliverable "%s" was %s', NEW.title, v_status_message),
        '/production/my-work',
        jsonb_build_object(
          'deliverable_id', NEW.id,
          'deliverable_title', NEW.title,
          'status', NEW.status,
          'solution_id', v_order.solution_id
        )
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on content_deliverables table
DROP TRIGGER IF EXISTS deliverable_status_trigger ON content_deliverables;
CREATE TRIGGER deliverable_status_trigger
  AFTER UPDATE ON content_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION notify_deliverable_status();

-- ============================================
-- 3. HIGH-VALUE ASSIGNMENT TRIGGER
-- Notifies: MD/CAIO when high-value assignment is requested
-- Thresholds: Software > 3L, Training > 2L, Content > 50K
-- ============================================

CREATE OR REPLACE FUNCTION notify_assignment_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_phase RECORD;
  v_solution RECORD;
  v_builder RECORD;
  v_threshold DECIMAL;
BEGIN
  -- Only trigger when status becomes 'requested'
  IF NEW.status = 'requested' THEN

    -- Get phase and solution info
    SELECT sp.id, sp.title, sp.estimated_value, sp.owner_department_id, sp.solution_id
    INTO v_phase
    FROM solution_phases sp
    WHERE sp.id = NEW.phase_id;

    IF v_phase.solution_id IS NOT NULL THEN
      SELECT s.id, s.title, s.solution_code, s.solution_type, s.base_price
      INTO v_solution
      FROM solutions s
      WHERE s.id = v_phase.solution_id;
    END IF;

    -- Get builder info
    SELECT b.id, b.name, b.user_id
    INTO v_builder
    FROM builders b
    WHERE b.id = NEW.builder_id;

    -- Determine threshold based on solution type
    v_threshold := CASE v_solution.solution_type
      WHEN 'software' THEN 300000  -- 3 Lakhs
      WHEN 'training' THEN 200000  -- 2 Lakhs
      WHEN 'content' THEN 50000    -- 50K
      ELSE 0
    END;

    -- Only notify for high-value assignments
    IF COALESCE(v_phase.estimated_value, v_solution.base_price, 0) > v_threshold THEN

      -- Notify MD/CAIO
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      SELECT
        u.id,
        'assignment_requested',
        'High-Value Assignment Approval Needed',
        format('%s requested assignment to "%s" (Rs.%s)',
          COALESCE(v_builder.name, 'A builder'),
          COALESCE(v_phase.title, v_solution.title),
          to_char(COALESCE(v_phase.estimated_value, v_solution.base_price), 'FM99,99,99,999')
        ),
        format('/software/phases/%s', v_phase.id),
        jsonb_build_object(
          'assignment_id', NEW.id,
          'builder_id', NEW.builder_id,
          'builder_name', v_builder.name,
          'phase_id', v_phase.id,
          'phase_title', v_phase.title,
          'solution_id', v_solution.id,
          'value', COALESCE(v_phase.estimated_value, v_solution.base_price),
          'threshold', v_threshold
        )
      FROM users u
      WHERE u.role = 'md_caio'
        AND u.is_active = true;

      -- Also notify department HOD
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      SELECT
        u.id,
        'assignment_requested',
        'Assignment Approval Needed',
        format('%s requested assignment to "%s"',
          COALESCE(v_builder.name, 'A builder'),
          COALESCE(v_phase.title, v_solution.title)
        ),
        format('/software/phases/%s', v_phase.id),
        jsonb_build_object(
          'assignment_id', NEW.id,
          'builder_id', NEW.builder_id,
          'builder_name', v_builder.name,
          'phase_id', v_phase.id,
          'value', COALESCE(v_phase.estimated_value, v_solution.base_price)
        )
      FROM users u
      WHERE u.role = 'department_head'
        AND u.department_id = v_phase.owner_department_id
        AND u.is_active = true;

    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on builder_assignments table
DROP TRIGGER IF EXISTS assignment_requested_trigger ON builder_assignments;
CREATE TRIGGER assignment_requested_trigger
  AFTER INSERT ON builder_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assignment_requested();

-- Also trigger on update to 'requested' status
DROP TRIGGER IF EXISTS assignment_requested_update_trigger ON builder_assignments;
CREATE TRIGGER assignment_requested_update_trigger
  AFTER UPDATE ON builder_assignments
  FOR EACH ROW
  WHEN (NEW.status = 'requested' AND OLD.status != 'requested')
  EXECUTE FUNCTION notify_assignment_requested();

-- ============================================
-- 4. ASSIGNMENT APPROVED TRIGGER
-- Notifies: Builder when their assignment is approved
-- ============================================

CREATE OR REPLACE FUNCTION notify_assignment_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_phase RECORD;
  v_solution RECORD;
  v_builder RECORD;
BEGIN
  -- Only trigger when status changes to 'approved' or 'active'
  IF NEW.status IN ('approved', 'active')
     AND OLD.status NOT IN ('approved', 'active') THEN

    -- Get builder info
    SELECT b.id, b.name, b.user_id
    INTO v_builder
    FROM builders b
    WHERE b.id = NEW.builder_id;

    -- Skip if builder has no user_id
    IF v_builder.user_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get phase and solution info
    SELECT sp.id, sp.title, sp.solution_id
    INTO v_phase
    FROM solution_phases sp
    WHERE sp.id = NEW.phase_id;

    IF v_phase.solution_id IS NOT NULL THEN
      SELECT s.id, s.title, s.solution_code
      INTO v_solution
      FROM solutions s
      WHERE s.id = v_phase.solution_id;
    END IF;

    -- Notify the builder
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_builder.user_id,
      'assignment_approved',
      'Assignment Approved!',
      format('Your assignment to "%s" has been approved',
        COALESCE(v_phase.title, v_solution.title, 'the phase')
      ),
      '/builder-portal/assignments',
      jsonb_build_object(
        'assignment_id', NEW.id,
        'phase_id', v_phase.id,
        'phase_title', v_phase.title,
        'solution_id', v_solution.id,
        'solution_title', v_solution.title
      )
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on builder_assignments table
DROP TRIGGER IF EXISTS assignment_approved_trigger ON builder_assignments;
CREATE TRIGGER assignment_approved_trigger
  AFTER UPDATE ON builder_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assignment_approved();

-- ============================================
-- 5. MOU STATUS TRIGGER
-- Notifies: Solution creator when MoU is signed
-- ============================================

CREATE OR REPLACE FUNCTION notify_mou_status()
RETURNS TRIGGER AS $$
DECLARE
  v_solution RECORD;
BEGIN
  -- Notify when MoU is signed
  IF NEW.status = 'signed' AND (OLD.status IS NULL OR OLD.status != 'signed') THEN

    -- Get solution details
    SELECT s.id, s.title, s.solution_code, s.created_by
    INTO v_solution
    FROM solutions s
    WHERE s.id = NEW.solution_id;

    -- Notify solution creator
    IF v_solution.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        v_solution.created_by,
        'mou_signed',
        'MoU Signed!',
        format('MoU for %s has been signed',
          COALESCE(v_solution.title, v_solution.solution_code)
        ),
        format('/solutions/%s/mou', v_solution.id),
        jsonb_build_object(
          'mou_id', NEW.id,
          'mou_number', NEW.mou_number,
          'solution_id', v_solution.id,
          'deal_value', NEW.deal_value
        )
      );
    END IF;

    -- Notify MoU creator if different from solution creator
    IF NEW.created_by IS NOT NULL
       AND NEW.created_by != COALESCE(v_solution.created_by, '00000000-0000-0000-0000-000000000000'::UUID) THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        NEW.created_by,
        'mou_signed',
        'MoU Signed!',
        format('MoU %s has been signed', NEW.mou_number),
        format('/solutions/%s/mou', v_solution.id),
        jsonb_build_object(
          'mou_id', NEW.id,
          'mou_number', NEW.mou_number,
          'solution_id', v_solution.id
        )
      );
    END IF;

    -- Notify MD/CAIO
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT
      u.id,
      'mou_signed',
      'MoU Signed',
      format('MoU for %s signed (Rs.%s)',
        COALESCE(v_solution.title, v_solution.solution_code),
        to_char(NEW.deal_value, 'FM99,99,99,999')
      ),
      format('/solutions/%s/mou', v_solution.id),
      jsonb_build_object(
        'mou_id', NEW.id,
        'mou_number', NEW.mou_number,
        'solution_id', v_solution.id,
        'deal_value', NEW.deal_value
      )
    FROM users u
    WHERE u.role = 'md_caio'
      AND u.is_active = true
      AND u.id != COALESCE(v_solution.created_by, '00000000-0000-0000-0000-000000000000'::UUID)
      AND u.id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::UUID);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on solution_mous table
DROP TRIGGER IF EXISTS mou_status_trigger ON solution_mous;
CREATE TRIGGER mou_status_trigger
  AFTER UPDATE ON solution_mous
  FOR EACH ROW
  EXECUTE FUNCTION notify_mou_status();

-- ============================================
-- 6. COHORT LEVEL UP REQUEST TRIGGER
-- Notifies: Training council (level 3 cohort members)
-- ============================================

CREATE OR REPLACE FUNCTION notify_level_up_request()
RETURNS TRIGGER AS $$
DECLARE
  v_member RECORD;
  v_current_level TEXT;
  v_next_level TEXT;
  v_council_member RECORD;
BEGIN
  -- This would be triggered by a status change or separate tracking table
  -- For now, we create a helper function that can be called manually
  -- when a level up request is submitted

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a callable function for level up notifications
CREATE OR REPLACE FUNCTION request_level_up(p_member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_member RECORD;
  v_level_names TEXT[] := ARRAY['Observer', 'Co-Lead', 'Lead', 'Master Trainer'];
  v_current_level_name TEXT;
  v_next_level_name TEXT;
BEGIN
  -- Get member info
  SELECT id, name, level, user_id
  INTO v_member
  FROM cohort_members
  WHERE id = p_member_id;

  IF v_member IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Cannot level up past level 3
  IF v_member.level >= 3 THEN
    RETURN FALSE;
  END IF;

  v_current_level_name := v_level_names[v_member.level + 1];
  v_next_level_name := v_level_names[v_member.level + 2];

  -- Notify all level 3 (Master Trainer) cohort members
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT
    cm.user_id,
    'level_up_request',
    'Level Up Request',
    format('%s requested level up from %s to %s',
      v_member.name,
      v_current_level_name,
      v_next_level_name
    ),
    '/training/cohort',
    jsonb_build_object(
      'member_id', v_member.id,
      'member_name', v_member.name,
      'current_level', v_member.level,
      'requested_level', v_member.level + 1
    )
  FROM cohort_members cm
  WHERE cm.level >= 3
    AND cm.status = 'active'
    AND cm.user_id IS NOT NULL
    AND cm.id != v_member.id;

  -- Also notify MD/CAIO
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT
    u.id,
    'level_up_request',
    'Level Up Request',
    format('%s requested promotion to %s',
      v_member.name,
      v_next_level_name
    ),
    '/training/cohort',
    jsonb_build_object(
      'member_id', v_member.id,
      'member_name', v_member.name,
      'current_level', v_member.level,
      'requested_level', v_member.level + 1
    )
  FROM users u
  WHERE u.role = 'md_caio'
    AND u.is_active = true;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. MOU EXPIRY CHECK FUNCTION
-- To be called by a cron job (pg_cron or external)
-- Notifies at 30, 14, 7, 3, 1 days before expiry
-- ============================================

CREATE OR REPLACE FUNCTION check_mou_expiry_notifications()
RETURNS TABLE(mou_id UUID, days_until_expiry INTEGER, notifications_sent INTEGER) AS $$
DECLARE
  v_mou RECORD;
  v_solution RECORD;
  v_days_until INTEGER;
  v_notification_days INTEGER[] := ARRAY[30, 14, 7, 3, 1];
  v_count INTEGER := 0;
BEGIN
  FOR v_mou IN
    SELECT m.id, m.mou_number, m.expiry_date, m.created_by, m.solution_id
    FROM solution_mous m
    WHERE m.status IN ('active', 'signed')
      AND m.expiry_date IS NOT NULL
      AND m.expiry_date >= CURRENT_DATE
      AND m.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  LOOP
    v_days_until := (v_mou.expiry_date - CURRENT_DATE);

    -- Check if this is a notification day
    IF v_days_until = ANY(v_notification_days) THEN

      -- Get solution details
      SELECT s.id, s.title, s.solution_code, s.created_by
      INTO v_solution
      FROM solutions s
      WHERE s.id = v_mou.solution_id;

      v_count := 0;

      -- Notify solution creator
      IF v_solution.created_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          v_solution.created_by,
          'mou_expiring',
          CASE
            WHEN v_days_until <= 3 THEN 'MoU Expiring Soon!'
            ELSE 'MoU Expiry Reminder'
          END,
          format('MoU for %s expires in %s day(s)',
            COALESCE(v_solution.title, v_solution.solution_code),
            v_days_until
          ),
          format('/solutions/%s/mou', v_solution.id),
          jsonb_build_object(
            'mou_id', v_mou.id,
            'mou_number', v_mou.mou_number,
            'expiry_date', v_mou.expiry_date,
            'days_until_expiry', v_days_until
          )
        )
        ON CONFLICT DO NOTHING;  -- Avoid duplicate notifications
        v_count := v_count + 1;
      END IF;

      -- Notify MoU creator if different
      IF v_mou.created_by IS NOT NULL
         AND v_mou.created_by != COALESCE(v_solution.created_by, '00000000-0000-0000-0000-000000000000'::UUID) THEN
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          v_mou.created_by,
          'mou_expiring',
          'MoU Expiry Reminder',
          format('MoU %s expires in %s day(s)', v_mou.mou_number, v_days_until),
          format('/solutions/%s/mou', v_solution.id),
          jsonb_build_object(
            'mou_id', v_mou.id,
            'expiry_date', v_mou.expiry_date,
            'days_until_expiry', v_days_until
          )
        )
        ON CONFLICT DO NOTHING;
        v_count := v_count + 1;
      END IF;

      -- Notify MD/CAIO
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      SELECT
        u.id,
        'mou_expiring',
        CASE
          WHEN v_days_until <= 3 THEN 'MoU Expiring Soon!'
          ELSE 'MoU Expiry Reminder'
        END,
        format('MoU for %s expires in %s day(s)',
          COALESCE(v_solution.title, v_mou.mou_number),
          v_days_until
        ),
        format('/solutions/%s/mou', v_solution.id),
        jsonb_build_object(
          'mou_id', v_mou.id,
          'mou_number', v_mou.mou_number,
          'solution_id', v_solution.id,
          'expiry_date', v_mou.expiry_date,
          'days_until_expiry', v_days_until
        )
      FROM users u
      WHERE u.role = 'md_caio'
        AND u.is_active = true
      ON CONFLICT DO NOTHING;

      SELECT COUNT(*) INTO v_count
      FROM users WHERE role = 'md_caio' AND is_active = true;

      mou_id := v_mou.id;
      days_until_expiry := v_days_until;
      notifications_sent := v_count;
      RETURN NEXT;

    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. SOLUTION STATUS CHANGE TRIGGER
-- Notifies: Client when solution status changes
-- ============================================

CREATE OR REPLACE FUNCTION notify_solution_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_client RECORD;
  v_status_label TEXT;
BEGIN
  -- Only trigger on meaningful status changes
  IF NEW.status != OLD.status
     AND NEW.status IN ('completed', 'in_amc', 'on_hold', 'cancelled') THEN

    v_status_label := CASE NEW.status
      WHEN 'completed' THEN 'completed'
      WHEN 'in_amc' THEN 'in AMC period'
      WHEN 'on_hold' THEN 'put on hold'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE NEW.status
    END;

    -- Notify solution creator
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        NEW.created_by,
        'system',
        'Solution Status Updated',
        format('%s has been %s',
          COALESCE(NEW.title, NEW.solution_code),
          v_status_label
        ),
        format('/solutions/%s', NEW.id),
        jsonb_build_object(
          'solution_id', NEW.id,
          'solution_code', NEW.solution_code,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on solutions table
DROP TRIGGER IF EXISTS solution_status_change_trigger ON solutions;
CREATE TRIGGER solution_status_change_trigger
  AFTER UPDATE ON solutions
  FOR EACH ROW
  EXECUTE FUNCTION notify_solution_status_change();

-- ============================================
-- HELPER: Clear old notifications
-- Run periodically to keep the table clean
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE read = true
    AND created_at < CURRENT_TIMESTAMP - (p_days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION notify_payment_received IS 'Trigger function: Notifies solution creator and MD when payment is received';
COMMENT ON FUNCTION notify_deliverable_status IS 'Trigger function: Notifies production learners when deliverable status changes';
COMMENT ON FUNCTION notify_assignment_requested IS 'Trigger function: Notifies MD/HOD for high-value assignment requests';
COMMENT ON FUNCTION notify_assignment_approved IS 'Trigger function: Notifies builder when assignment is approved';
COMMENT ON FUNCTION notify_mou_status IS 'Trigger function: Notifies stakeholders when MoU is signed';
COMMENT ON FUNCTION request_level_up IS 'Callable function: Creates level up request notifications for cohort member';
COMMENT ON FUNCTION check_mou_expiry_notifications IS 'Cron function: Check and send MoU expiry notifications (30, 14, 7, 3, 1 days)';
COMMENT ON FUNCTION notify_solution_status_change IS 'Trigger function: Notifies creator when solution status changes';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Maintenance function: Removes read notifications older than specified days';
