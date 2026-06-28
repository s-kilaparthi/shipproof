export type Severity = "Critical" | "Warning" | "Info";

export type Tool = "Cursor" | "Lovable" | "Bolt" | "V0";

export type ScanStatus =
  | "pending"
  | "scanning"
  | "running"
  | "completed"
  | "failed";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  github_username?: string | null;
  created_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  file?: string;
  line?: number;
  fix_prompt?: string;
}

export interface ScanResult {
  id: string;
  scan_id: string;
  issues: Issue[];
  summary: string;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  repo_url: string;
  repo_name: string;
  tool_selected: Tool;
  discovery_response?: string;
  status: ScanStatus;
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
}

export interface CreateScanResponse {
  id: string;
}

export type ScanStep = 1 | 2 | 3 | 4;

export interface ScanFormState {
  selectedRepo: GitHubRepo | null;
  selectedTool: Tool | null;
  discoveryResponse: string;
  scanId: string | null;
}

export const DISCOVERY_PROMPT = `Please analyze this codebase and provide:
1. Tech stack (frontend framework, backend, database, auth, hosting)
2. What this app does in 2 sentences
3. All API routes/endpoints and what they do
4. Database tables and their relationships
5. Environment variable names (not values)
6. Third party services connected
7. Any existing security measures implemented
8. Any existing error handling
9. File structure overview`;

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
