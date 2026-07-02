ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS migration_filename TEXT;
