import type { PillarScores, ScanIssueRow } from "@/types";

const DEMO_SCAN_ID = "shipproof-demo";

function issue(
  id: string,
  data: Omit<ScanIssueRow, "id" | "scan_id" | "created_at">
): ScanIssueRow {
  return {
    id,
    scan_id: DEMO_SCAN_ID,
    created_at: "2026-03-01T00:00:00.000Z",
    ...data,
  };
}

export const DEMO_FIXED_ISSUE_IDS = [
  "demo-1",
  "demo-2",
  "demo-3",
  "demo-4",
  "demo-5",
  "demo-6",
  "demo-7",
];

export const DEMO_ISSUE_NOTES: Record<string, string> = {
  "demo-8":
    "Known limitation of Next.js — we're working on a proper nonce implementation",
};

export const DEMO_PILLAR_SCORES: PillarScores = {
  overall: 67,
  scoredPillarCount: 8,
  totalPillarCount: 8,
  security: { score: 45, confidence: "high" },
  database: { score: 92, confidence: "high" },
  performance: { score: 100, confidence: "high" },
  reliability: { score: 91, confidence: "high" },
  observability: { score: 93, confidence: "high" },
  devops: { score: 98, confidence: "high" },
  infrastructure: { score: 100, confidence: "high" },
  dependencies: { score: 96, confidence: "high" },
};

export const DEMO_ISSUES: ScanIssueRow[] = [
  issue("demo-1", {
    pillar: "security",
    severity: "critical",
    issue_name: "Open redirect in OAuth callback",
    file_path: "app/auth/callback/route.ts",
    line_number: null,
    description:
      "The next parameter was not validated, allowing attackers to redirect users to malicious sites after login.",
    fix_prompt:
      "In app/auth/callback/route.ts, validate the next parameter to only allow relative paths starting with / and not //.",
    fix_type: "cursor",
    fix_confidence: "certain",
    confidence: "high",
  }),
  issue("demo-2", {
    pillar: "security",
    severity: "critical",
    issue_name: "No rate limiting on scan endpoints",
    file_path: "app/api/scan/analyze/route.ts",
    line_number: null,
    description:
      "Anyone could spam the scan endpoint and drain Claude API credits with no limit.",
    fix_prompt:
      "Add Upstash Redis rate limiting: 5 scans per 60 seconds per user, 10 per IP.",
    fix_type: "cursor",
    fix_confidence: "certain",
    confidence: "high",
  }),
  issue("demo-3", {
    pillar: "security",
    severity: "critical",
    issue_name: "Unauthenticated stub API endpoints",
    file_path: "app/api/auth/route.ts",
    line_number: null,
    description:
      "Three stub routes had no auth checks, exposing unnecessary API surface to anyone.",
    fix_prompt:
      "Add requireUser() check to all stub API routes before returning any response.",
    fix_type: "cursor",
    fix_confidence: "certain",
    confidence: "high",
  }),
  issue("demo-4", {
    pillar: "security",
    severity: "critical",
    issue_name: "GitHub OAuth token via unverified session",
    file_path: "lib/auth.ts",
    line_number: null,
    description:
      "getGitHubToken used getSession() without server-side JWT verification first.",
    fix_prompt:
      "Call getUser() to verify JWT before reading provider_token from getSession().",
    fix_type: "cursor",
    fix_confidence: "certain",
    confidence: "high",
  }),
  issue("demo-5", {
    pillar: "database",
    severity: "warning",
    issue_name: "Missing indexes on foreign key columns",
    file_path: "supabase/migrations/",
    line_number: null,
    description:
      "scans.user_id and scan_results.scan_id had no indexes, causing full table scans.",
    fix_prompt:
      "CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);",
    fix_type: "sql",
    fix_confidence: "certain",
    confidence: "high",
  }),
  issue("demo-6", {
    pillar: "security",
    severity: "warning",
    issue_name: "No security headers configured",
    file_path: "next.config.mjs",
    line_number: null,
    description:
      "Missing CSP, HSTS, X-Frame-Options and X-Content-Type-Options headers.",
    fix_prompt:
      "Add headers() function to next.config.mjs with all security headers.",
    fix_type: "cursor",
    fix_confidence: "certain",
    confidence: "high",
  }),
  issue("demo-7", {
    pillar: "dependencies",
    severity: "info",
    issue_name: "Vulnerable Dependency: vite",
    file_path: "package.json",
    line_number: null,
    description:
      "GHSA-fx2h-pf6j-xcff: Known vulnerability in vite 8.0.12.",
    fix_prompt:
      "Ask your AI tool to safely update vite to a compatible newer version.",
    fix_type: "cursor",
    fix_confidence: "uncertain",
    confidence: "high",
  }),
  issue("demo-8", {
    pillar: "security",
    severity: "critical",
    issue_name: "CSP allows unsafe-inline scripts",
    file_path: "next.config.mjs",
    line_number: null,
    description:
      "unsafe-inline in CSP negates XSS protection. Requires nonce implementation which is complex in Next.js.",
    fix_prompt:
      "This requires implementing CSP nonces in Next.js middleware — complex but important for production security.",
    fix_type: "cursor",
    fix_confidence: "uncertain",
    confidence: "medium",
  }),
];

export const DEMO_SCAN_ID_EXPORT = DEMO_SCAN_ID;
