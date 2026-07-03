type PreviewCandidate = {
  severity: string;
  fix_confidence?: string | null;
};

function severityKey(severity: string): string {
  return severity.toLowerCase();
}

/** Pick the best issue index for the free-tier unlocked preview. */
export function pickFreePreviewIndex(issues: PreviewCandidate[]): number {
  if (issues.length === 0) return -1;

  const certainCritical = issues.findIndex(
    (issue) =>
      severityKey(issue.severity) === "critical" &&
      issue.fix_confidence === "certain"
  );
  if (certainCritical >= 0) return certainCritical;

  const certainWarning = issues.findIndex(
    (issue) =>
      severityKey(issue.severity) === "warning" &&
      issue.fix_confidence === "certain"
  );
  if (certainWarning >= 0) return certainWarning;

  const certainAny = issues.findIndex(
    (issue) => issue.fix_confidence === "certain"
  );
  if (certainAny >= 0) return certainAny;

  return 0;
}
