import type { Confidence, FixStep, Pillar, PillarScores, ScanIssueRow } from "@/types";
import { calculateHealthScores } from "./health-score";
import { parseFixPrompt } from "./fix-parser";

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
    is_multi_step?: boolean;
    fix_steps?: FixStep[] | null;
    confidence?: Confidence;
    evidence?: string | null;
  }>;
}

function normalizeFixSteps(raw: unknown): FixStep[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw as FixStep[];
}

function enrichIssueFixSteps(
  fixPrompt: string,
  isMultiStep?: boolean,
  fixSteps?: FixStep[] | null
): { is_multi_step: boolean; fix_steps: FixStep[] | null } {
  if (isMultiStep != null && fixSteps != null) {
    return {
      is_multi_step: isMultiStep,
      fix_steps: fixSteps.length > 0 ? fixSteps : null,
    };
  }

  const parsed = parseFixPrompt(fixPrompt);
  return {
    is_multi_step: parsed.isMultiStep,
    fix_steps: parsed.isMultiStep ? parsed.steps : null,
  };
}

export function normalizeScanIssues(
  rows: Record<string, unknown>[],
  scanId: string
): ScanIssueRow[] {
  if (rows.length === 0) return [];

  const first = rows[0];

  if ("issue_name" in first) {
    return (rows as unknown as ScanIssueRow[]).map((row) => {
      const fixPrompt = row.fix_prompt ?? "";
      const fixMeta = enrichIssueFixSteps(
        fixPrompt,
        row.is_multi_step,
        normalizeFixSteps(row.fix_steps)
      );

      return {
        ...row,
        pillar: (row.pillar ?? "security") as Pillar,
        confidence: (row.confidence ?? "medium") as Confidence,
        evidence: row.evidence ?? null,
        is_multi_step: fixMeta.is_multi_step,
        fix_steps: fixMeta.fix_steps,
      };
    });
  }

  if ("issues" in first && Array.isArray(first.issues)) {
    const jsonb = first as JsonbScanResult;
    return (jsonb.issues ?? []).map((issue, index) => {
      const fixPrompt = issue.fix_prompt ?? "";
      const fixMeta = enrichIssueFixSteps(fixPrompt);

      return {
        id: `jsonb-${index}`,
        scan_id: scanId,
        severity: issue.severity,
        pillar: (issue.pillar ?? "security") as Pillar,
        issue_name: issue.issue_name ?? issue.title ?? `Issue ${index + 1}`,
        file_path: issue.file_path ?? issue.file ?? null,
        line_number: issue.line_number ?? issue.line ?? null,
        description: issue.description,
        fix_prompt: fixPrompt,
        is_multi_step: fixMeta.is_multi_step,
        fix_steps: fixMeta.fix_steps,
        confidence: issue.confidence ?? "medium",
        evidence: issue.evidence ?? null,
        created_at: new Date().toISOString(),
      };
    });
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
