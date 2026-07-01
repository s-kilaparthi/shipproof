const STORAGE_KEY_PREFIX = "shipproof_fixed_";

export function getFixedIssuesKey(scanId: string): string {
  return `${STORAGE_KEY_PREFIX}${scanId}`;
}

export function readFixedIssueIds(scanId: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getFixedIssuesKey(scanId));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeFixedIssueIds(scanId: string, issueIds: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getFixedIssuesKey(scanId), JSON.stringify(issueIds));
}

export function markIssueFixed(scanId: string, issueId: string): string[] {
  const ids = readFixedIssueIds(scanId);
  if (!ids.includes(issueId)) {
    ids.push(issueId);
  }
  writeFixedIssueIds(scanId, ids);
  return ids;
}

export function unmarkIssueFixed(scanId: string, issueId: string): string[] {
  const ids = readFixedIssueIds(scanId).filter((id) => id !== issueId);
  writeFixedIssueIds(scanId, ids);
  return ids;
}

export function clearFixedIssues(scanId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getFixedIssuesKey(scanId));
}

export function getFixedIssueCount(scanId: string): number {
  return readFixedIssueIds(scanId).length;
}
