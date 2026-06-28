export type Severity = "Critical" | "Warning" | "Info";

export type Tool = "Cursor" | "Lovable" | "Bolt" | "V0";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
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
  tool: Tool;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  result?: ScanResult;
}
