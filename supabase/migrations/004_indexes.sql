-- Indexes already applied to database
-- Documented here for version control
CREATE INDEX IF NOT EXISTS idx_scans_user_id 
  ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id 
  ON scan_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scans_repo_name 
  ON scans(repo_name);
CREATE INDEX IF NOT EXISTS idx_scans_user_repo_status 
  ON scans(user_id, repo_name, status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at 
  ON scans(created_at DESC);
