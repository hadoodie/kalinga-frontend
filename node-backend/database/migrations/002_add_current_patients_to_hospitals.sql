-- ============================================================
-- Migration 002: Add current_patients column to hospitals
-- Strictly additive — no DROP operations
-- ============================================================

-- Add the column only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'current_patients'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN current_patients INT DEFAULT 0;
  END IF;
END $$;

-- Seed realistic current_patients values for the 9 existing hospitals
-- Values are set relative to each hospital's bed_capacity to produce
-- meaningful occupancy percentages when calculated as:
--   occupancy_pct = (current_patients / bed_capacity) * 100

UPDATE hospitals SET current_patients = 1410 WHERE code = 'PGH-001';    -- PGH:    1410/1500 = 94%
UPDATE hospitals SET current_patients = 736  WHERE code = 'EAMC-001';   -- EAMC:    736/800  = 92%
UPDATE hospitals SET current_patients = 468  WHERE code = 'RMC-001';    -- RMC:     468/600  = 78%
UPDATE hospitals SET current_patients = 686  WHERE code = 'JRRMMC-001'; -- JRRMMC:  686/700  = 98%
UPDATE hospitals SET current_patients = 352  WHERE code = 'NCH-001';    -- NCH:     352/400  = 88%
UPDATE hospitals SET current_patients = 410  WHERE code = 'OMMC-001';   -- OMMC:    410/500  = 82%

-- Catch any earlier-seeded hospitals that may not have a code match.
-- Fall back to using current_occupancy as the source if available.
UPDATE hospitals
SET current_patients = COALESCE(current_occupancy, ROUND(bed_capacity * 0.75))
WHERE current_patients = 0
  AND bed_capacity IS NOT NULL
  AND bed_capacity > 0;
