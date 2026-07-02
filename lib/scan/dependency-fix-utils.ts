import type { ScanIssue } from "./types";

export function buildDependencyVulnerabilityFixPrompt(params: {
  packageName: string;
  version: string;
  vulnId: string;
  description: string;
}): string {
  return `I have a security vulnerability in my app.
Package: ${params.packageName}
Version: ${params.version}
Vulnerability: ${params.vulnId} — ${params.description}

Please check if updating this package is safe with my current setup and update it carefully if so. If updating would break things, tell me the safest way to handle this.`;
}

export function isDependencyVulnerabilityIssue(issue: {
  pillar?: string;
  issue_name?: string;
}): boolean {
  if (issue.pillar === "dependencies") return true;

  const name = (issue.issue_name ?? "").toLowerCase();
  return (
    /vulnerable dependency/.test(name) ||
    /dependency vulnerability/.test(name) ||
    /outdated (npm )?package/.test(name)
  );
}

function parseDependencyIssueFields(issue: ScanIssue): {
  packageName: string;
  version: string;
  vulnId: string;
  description: string;
} {
  const packageFromName = issue.issue_name.match(
    /vulnerable dependency:\s*(.+)/i
  )?.[1];
  const packageFromPrompt = issue.fix_prompt.match(
    /(?:update|install|upgrade)\s+([^\s@]+)(?:@|\s+from\s+)([^\s.]+)/i
  );

  const descParts = issue.description.match(/^([^:]+):\s*(.+)$/);
  const versionFromPrompt = issue.fix_prompt.match(
    /from\s+([^\s]+)\s+to/i
  )?.[1];

  return {
    packageName:
      packageFromName?.trim() ??
      packageFromPrompt?.[1]?.trim() ??
      "the affected package",
    version:
      versionFromPrompt?.trim() ??
      packageFromPrompt?.[2]?.trim() ??
      "unknown",
    vulnId: descParts?.[1]?.trim() ?? "unknown vulnerability",
    description: descParts?.[2]?.trim() ?? issue.description,
  };
}

function looksLikeTerminalDependencyFix(fixPrompt: string): boolean {
  return (
    /npm install\b/i.test(fixPrompt) ||
    /pip install\b/i.test(fixPrompt) ||
    /yarn add\b/i.test(fixPrompt) ||
    /pnpm add\b/i.test(fixPrompt) ||
    /run:\s*(npm|pip|yarn|pnpm)/i.test(fixPrompt)
  );
}

export function normalizeDependencyVulnerabilityIssue(issue: ScanIssue): ScanIssue {
  const looksTerminalDepFix = looksLikeTerminalDependencyFix(issue.fix_prompt);
  if (!isDependencyVulnerabilityIssue(issue) && !looksTerminalDepFix) return issue;

  const fields = parseDependencyIssueFields(issue);
  const shouldRewritePrompt =
    issue.fix_type === "terminal" ||
    !issue.fix_prompt.trim() ||
    looksLikeTerminalDependencyFix(issue.fix_prompt);

  return {
    ...issue,
    fix_type: "cursor",
    fix_confidence: "uncertain",
    fix_prompt: shouldRewritePrompt
      ? buildDependencyVulnerabilityFixPrompt(fields)
      : issue.fix_prompt,
  };
}
