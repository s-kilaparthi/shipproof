import type { FixStep, Pillar } from "@/types";

export type Confidence = "high" | "medium" | "low";

export interface ScanIssue {
  pillar: Pillar;
  severity: "critical" | "warning" | "info";
  issue_name: string;
  file_path: string | null;
  line_number: number | null;
  description: string;
  fix_prompt: string;
  is_multi_step?: boolean;
  fix_steps?: FixStep[] | null;
  confidence?: Confidence;
  evidence?: string | null;
}

export interface ScanEngineInput {
  discoveryResponse: string;
  codeMarkdown: string;
  files: { path: string; content: string }[];
  tool: import("@/types").Tool;
  domain?: string | null;
}

export interface ScanEngineResult {
  issues: ScanIssue[];
}
