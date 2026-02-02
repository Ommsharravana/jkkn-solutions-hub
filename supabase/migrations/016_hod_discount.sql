-- ============================================
-- 016: HOD DISCOUNT
-- Add HOD discount column to solutions table
-- ============================================

-- Add hod_discount column (0-10% discount from department's share)
ALTER TABLE solutions
ADD COLUMN hod_discount INTEGER DEFAULT 0
  CHECK (hod_discount >= 0 AND hod_discount <= 10);

-- Comment
COMMENT ON COLUMN solutions.hod_discount IS 'HOD can offer 0-10% discount from department share to reduce client price';
