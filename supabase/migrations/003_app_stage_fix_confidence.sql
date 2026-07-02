-- App lifecycle stage on scans
ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS app_stage TEXT;

-- Fix confidence on individual issues
ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS fix_confidence TEXT DEFAULT 'certain';
