import type { Confidence, Pillar, PillarScores, ScanIssueRow } from "@/types";
import { calculateHealthScores } from "./health-score";

interface JsonbScanResult {
  issues?: Array<{
    severity: string;
    pillar?: Pillar;
    issue_name?: string;
    title?: string;
    file_path?: string | null;
    file?: string;
    line_number?: number | null;
    line?: number;
    description: string;
    fix_prompt?: string;
    confidence?: Confidence;
    evidence?: string | null;
  }>;
}

export function normalizeScanIssues(
  rows: Record<string, unknown>[],
  scanId: string
): ScanIssueRow[] {
  if (rows.length === 0) return [];

  const first = rows[0];

  if ("issue_name" in first) {
    return (rows as unknown as ScanIssueRow[]).map((row) => ({
      ...row,
      pillar: (row.pillar ?? "security") as Pillar,
      confidence: (row.confidence ?? "medium") as Confidence,
      evidence: row.evidence ?? null,
    }));
  }

  if ("issues" in first && Array.isArray(first.issues)) {
    const jsonb = first as JsonbScanResult;
    return (jsonb.issues ?? []).map((issue, index) => ({
      id: `jsonb-${index}`,
      scan_id: scanId,
      severity: issue.severity,
      pillar: (issue.pillar ?? "security") as Pillar,
      issue_name: issue.issue_name ?? issue.title ?? `Issue ${index + 1}`,
      file_path: issue.file_path ?? issue.file ?? null,
      line_number: issue.line_number ?? issue.line ?? null,
      description: issue.description,
      fix_prompt: issue.fix_prompt ?? "",
      confidence: issue.confidence ?? "medium",
      evidence: issue.evidence ?? null,
      created_at: new Date().toISOString(),
    }));
  }

  return [];
}

export function parsePillarScores(
  raw: unknown,
  issues: ScanIssueRow[]
): PillarScores {
  if (raw && typeof raw === "object" && "overall" in (raw as object)) {
    return raw as PillarScores;
  }

  return calculateHealthScores(issues);
}

export function groupIssuesByPillar(
  issues: ScanIssueRow[]
): Record<Pillar, ScanIssueRow[]> {
  const groups: Record<Pillar, ScanIssueRow[]> = {
    security: [],
    database: [],
    performance: [],
    reliability: [],
    observability: [],
    devops: [],
    infrastructure: [],
    dependencies: [],
  };

  for (const issue of issues) {
    const pillar = issue.pillar ?? "security";
    groups[pillar].push(issue);
  }

  return groups;
}
