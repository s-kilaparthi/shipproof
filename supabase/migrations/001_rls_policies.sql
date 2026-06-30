-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Scans policies
CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scans" ON scans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON scans
  FOR DELETE USING (auth.uid() = user_id);

-- Scan results policies
CREATE POLICY "Users can view own scan results" ON scan_results
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM scans WHERE id = scan_id)
  );
CREATE POLICY "Users can create own scan results" ON scan_results
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM scans WHERE id = scan_id)
  );
CREATE POLICY "Users can delete own scan results" ON scan_results
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM scans WHERE id = scan_id)
  );
