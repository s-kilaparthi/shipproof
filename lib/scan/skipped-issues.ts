export type SkipReason = "break" | "not_relevant" | "later";

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  break: "Fix might break my app",
  not_relevant: "Not relevant to my project",
  later: "I'll fix it later",
};

export function getSkippedIssueKey(scanId: string, issueId: string): string {
  return `skipped_${scanId}_${issueId}`;
}

function isSkipReason(value: string | null): value is SkipReason {
  return value === "break" || value === "not_relevant" || value === "later";
}

export function readSkippedIssues(
  scanId: string
): Record<string, SkipReason> {
  if (typeof window === "undefined") return {};

  const prefix = `skipped_${scanId}_`;
  const skipped: Record<string, SkipReason> = {};

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;

    const issueId = key.slice(prefix.length);
    const reason = localStorage.getItem(key);
    if (isSkipReason(reason)) {
      skipped[issueId] = reason;
    }
  }

  return skipped;
}

export function readSkippedIssueIds(scanId: string): string[] {
  return Object.keys(readSkippedIssues(scanId));
}

export function markIssueSkipped(
  scanId: string,
  issueId: string,
  reason: SkipReason
): Record<string, SkipReason> {
  if (typeof window === "undefined") return readSkippedIssues(scanId);

  localStorage.setItem(getSkippedIssueKey(scanId, issueId), reason);
  return readSkippedIssues(scanId);
}

export function unmarkIssueSkipped(
  scanId: string,
  issueId: string
): Record<string, SkipReason> {
  if (typeof window === "undefined") return readSkippedIssues(scanId);

  localStorage.removeItem(getSkippedIssueKey(scanId, issueId));
  return readSkippedIssues(scanId);
}

export function clearSkippedIssues(scanId: string): void {
  if (typeof window === "undefined") return;

  const prefix = `skipped_${scanId}_`;
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}
