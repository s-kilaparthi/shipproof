-- Store per-issue data confidence when available
ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS pillar_confidence TEXT DEFAULT 'medium';

-- pillar_scores JSONB on scans now stores per-pillar objects:
-- { "security": { "score": 45, "confidence": "high" }, "devops": { "score": 0, "confidence": "insufficient" } }
-- No schema change required for scans.pillar_scores (already JSONB).
-- New scans will write the expanded structure automatically.
