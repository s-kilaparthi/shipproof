import type { Confidence, ScanIssue } from "./types";

export function deduplicateIssues(issues: ScanIssue[]): {
  issues: ScanIssue[];
  removed: number;
} {
  const map = new Map<string, ScanIssue>();

  for (const issue of issues) {
    const key = `${issue.file_path ?? "null"}::${issue.issue_name.toLowerCase()}`;
    const existing = map.get(key);

    if (
      !existing ||
      issue.description.length > existing.description.length ||
      (issue.evidence?.length ?? 0) > (existing.evidence?.length ?? 0)
    ) {
      map.set(key, issue);
    }
  }

  const deduped = Array.from(map.values());
  return { issues: deduped, removed: issues.length - deduped.length };
}

export function filterByConfidence(issues: ScanIssue[]): {
  issues: ScanIssue[];
  filteredLow: number;
} {
  const filtered = issues.filter((issue) => issue.confidence !== "low");
  return { issues: filtered, filteredLow: issues.length - filtered.length };
}

export function normalizeConfidence(value: unknown): Confidence {
  const v = String(value ?? "medium").toLowerCase();
  if (v === "high" || v === "low") return v;
  return "medium";
}
