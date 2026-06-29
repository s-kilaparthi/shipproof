export type Severity = "Critical" | "Warning" | "Info";

export type Tool = "Cursor" | "Lovable" | "Bolt" | "V0";

export type Pillar =
  | "security"
  | "database"
  | "performance"
  | "reliability"
  | "observability"
  | "devops"
  | "infrastructure"
  | "dependencies";

export type DisplayPillar =
  | "security"
  | "database"
  | "performance"
  | "reliability"
  | "observability"
  | "devops";

export type ScanStatus =
  | "pending"
  | "scanning"
  | "running"
  | "completed"
  | "failed";

export interface PillarScores {
  overall: number;
  security: number;
  database: number;
  performance: number;
  reliability: number;
  observability: number;
  devops: number;
  infrastructure: number;
  dependencies: number;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  github_username?: string | null;
  created_at: string;
}

export type Confidence = "high" | "medium" | "low";

export type FixType = "cursor" | "sql" | "terminal" | "manual";

export interface Issue {
  id?: string;
  title: string;
  description: string;
  severity: Severity;
  file?: string;
  line?: number;
  fix_prompt?: string;
  fix_type?: FixType;
  is_multi_step?: boolean;
  fix_steps?: FixStep[] | null;
  pillar?: Pillar;
}

export interface FixStep {
  stepNumber: number;
  filePath: string;
  instruction: string;
  fixType?: FixType;
}

export interface ScanIssueRow {
  id: string;
  scan_id: string;
  severity: string;
  pillar: Pillar;
  issue_name: string;
  file_path: string | null;
  line_number: number | null;
  description: string;
  fix_prompt: string;
  fix_type?: FixType;
  is_multi_step?: boolean;
  fix_steps?: FixStep[] | null;
  fingerprint?: string | null;
  confidence?: Confidence;
  evidence?: string | null;
  created_at: string;
}

export interface ScanResult {
  id: string;
  scan_id: string;
  issues: Issue[];
  summary: string;
  fix_prompt?: string;
  fix_type?: FixType;
  is_multi_step?: boolean;
  fix_steps?: FixStep[] | null;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  repo_url: string;
  repo_name: string;
  tool_selected: Tool;
  discovery_response?: string;
  domain?: string | null;
  status: ScanStatus;
  overall_score?: number | null;
  pillar_scores?: PillarScores | null;
  created_at: string;
  completed_at?: string | null;
  result?: ScanResult;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  description: string | null;
  updated_at: string;
}

export interface CreateScanRequest {
  repo_name: string;
  repo_url: string;
  tool_selected: Tool;
  discovery_response: string;
  domain?: string;
}

export interface CreateScanResponse {
  id: string;
}

export interface AnalyzeScanResponse {
  success?: boolean;
  scan_id: string;
  issues_count?: number;
  overall_score?: number;
  pillar_scores?: PillarScores;
}

export interface ScanHistoryResponse {
  hasPreviousScan: boolean;
  scanId?: string;
  createdAt?: string;
  issueCount?: number;
  overallScore?: number | null;
}

export type ScanStep = 1 | 2 | 3 | 4;

export interface ScanFormState {
  selectedRepo: GitHubRepo | null;
  selectedTool: Tool | null;
  discoveryResponse: string;
  domain: string;
  scanId: string | null;
}

export const DISCOVERY_PROMPT = `You are a code documentation assistant. Do not evaluate or judge the code.
Just answer each question factually based on what exists in this codebase 
right now. Answer with specific file names, line numbers, and exact code 
snippets where relevant.

## PILLAR 1 — IDENTITY
- What does this app do (2 sentences max)
- Primary language and frameworks with exact versions
- Hosting platforms used

## PILLAR 2 — SECURITY (most important)
For EVERY API endpoint list:
- Method + full path
- File name and line number where defined
- Does it check authentication before proceeding? Quote the exact auth 
  check code or write NONE
- What user input does it accept (body, params, query)
- Does it validate that input? Quote validation code or write NONE
Also provide:
- CORS configuration — quote exact settings or write NONE
- Any hardcoded API keys, secrets, or credentials — quote them or write NONE
- File upload endpoints — list them and their validation or write NONE

## PILLAR 3 — DATABASE
- Every table name with its columns
- Every foreign key relationship
- RLS policies — quote all policy definitions or write NONE
- Indexes defined — quote them or write NONE
- Any raw SQL strings in codebase — quote them or write NONE
- Connection pooling configuration — quote it or write NONE
- How database migrations are handled

## PILLAR 4 — RELIABILITY
- Global error handler — quote it or write NONE
- How unhandled promise rejections are caught — quote or write NONE
- What happens when database calls fail — describe with code reference
- Any retry logic — quote it or write NONE
- Background jobs or queues — describe or write NONE
- Health check endpoint — quote it or write NONE
- Timeout configuration — quote it or write NONE

## PILLAR 5 — OBSERVABILITY
- Logging implementation — what tool, what is logged, quote setup or write NONE
- Error monitoring service — name it or write NONE
- Performance monitoring — name it or write NONE
- Any alerting configured — describe or write NONE

## PILLAR 6 — DEVOPS
- How many environments exist (dev/staging/prod)
- CI/CD pipeline — describe or write NONE
- Rate limiting implementation — quote it or write NONE
- How secrets/environment variables are managed
- Every environment variable name used in code (not values)
- Third party services connected
- Docker or container configuration — describe or write NONE
- Dependency management approach`;

export const TOOL_OPTIONS: {
  id: Tool;
  name: string;
  description: string;
}[] = [
  {
    id: "Cursor",
    name: "Cursor",
    description: "AI code editor",
  },
  {
    id: "Lovable",
    name: "Lovable",
    description: "AI web app builder",
  },
  {
    id: "Bolt",
    name: "Bolt",
    description: "AI full stack builder",
  },
  {
    id: "V0",
    name: "V0",
    description: "AI UI builder by Vercel",
  },
];

export const SCAN_STEPS = [
  { step: 1 as ScanStep, label: "Select Repo" },
  { step: 2 as ScanStep, label: "Select Tool" },
  { step: 3 as ScanStep, label: "Discovery" },
  { step: 4 as ScanStep, label: "Report" },
];

export const DISPLAY_PILLARS: { id: DisplayPillar; label: string }[] = [
  { id: "security", label: "Security" },
  { id: "database", label: "Database" },
  { id: "performance", label: "Performance" },
  { id: "reliability", label: "Reliability" },
  { id: "observability", label: "Observability" },
  { id: "devops", label: "DevOps" },
];

export const ALL_PILLARS: { id: Pillar; label: string }[] = [
  { id: "security", label: "Security" },
  { id: "database", label: "Database" },
  { id: "performance", label: "Performance" },
  { id: "reliability", label: "Reliability" },
  { id: "observability", label: "Observability" },
  { id: "devops", label: "DevOps" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "dependencies", label: "Dependencies" },
];
