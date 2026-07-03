ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN DEFAULT false;

ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS is_limited BOOLEAN DEFAULT false;

-- Ensure usage columns exist (no-op if already present)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS total_scans_used INTEGER DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Existing users get their free scan (no breaking change)
UPDATE users
SET
  total_scans_used = 0,
  plan = COALESCE(NULLIF(plan, ''), 'free');
