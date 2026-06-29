export function generateFingerprint(issue: {
  pillar: string;
  issue_name: string;
  file_path: string | null;
}): string {
  const normalizedName = issue.issue_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const normalizedFile = (issue.file_path || "no-file")
    .toLowerCase()
    .replace(/[^a-z0-9/.]/g, "-");

  return `${issue.pillar}:${normalizedName}:${normalizedFile}`;
}
