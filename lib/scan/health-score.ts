import type { Pillar, PillarScores } from "@/types";

export interface IssueCount {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

export function normalizeSeverity(severity: string): string {
  return severity.toLowerCase();
}

export function countIssuesBySeverity(
  issues: { severity: string }[]
): IssueCount {
  const counts: IssueCount = { critical: 0, warning: 0, info: 0, total: 0 };

  for (const issue of issues) {
    const s = issue.severity.toLowerCase();
    if (s === "critical") counts.critical++;
    else if (s === "warning") counts.warning++;
    else counts.info++;
    counts.total++;
  }

  return counts;
}

function deductScore(score: number, severity: string): number {
  const s = severity.toLowerCase();
  if (s === "critical") return score - 15;
  if (s === "warning") return score - 7;
  if (s === "info") return score - 2;
  return score;
}

export function calculatePillarScore(
  issues: { severity: string; pillar?: string }[],
  pillar?: Pillar
): number {
  let score = 100;
  const filtered = pillar
    ? issues.filter((i) => i.pillar === pillar)
    : issues;

  for (const issue of filtered) {
    score = deductScore(score, issue.severity);
  }

  return Math.max(0, score);
}

export function calculateHealthScores(
  issues: { severity: string; pillar?: string }[]
): PillarScores {
  return {
    overall: calculatePillarScore(issues),
    security: calculatePillarScore(issues, "security"),
    database: calculatePillarScore(issues, "database"),
    performance: calculatePillarScore(issues, "performance"),
    reliability: calculatePillarScore(issues, "reliability"),
    observability: calculatePillarScore(issues, "observability"),
    devops: calculatePillarScore(issues, "devops"),
    infrastructure: calculatePillarScore(issues, "infrastructure"),
    dependencies: calculatePillarScore(issues, "dependencies"),
  };
}

/** @deprecated use calculateHealthScores().overall */
export function calculateHealthScore(
  issues: { severity: string; pillar?: string }[]
): number {
  return calculateHealthScores(issues).overall;
}

export function getHealthScoreColor(score: number): string {
  if (score < 50) return "text-red-600";
  if (score <= 80) return "text-yellow-600";
  return "text-green-600";
}

export function getHealthScoreBg(score: number): string {
  if (score < 50) return "bg-red-100 text-red-700 border-red-200";
  if (score <= 80) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Production Ready";
  if (score >= 50) return "Needs Attention";
  return "Not Ready to Ship";
}

export function getSeverityBadgeVariant(
  severity: string
): "destructive" | "secondary" | "outline" {
  const s = severity.toLowerCase();
  if (s === "critical") return "destructive";
  if (s === "warning") return "secondary";
  return "outline";
}

export function getSeverityColor(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (s === "warning") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

export function getPillarDotColor(score: number): string {
  if (score < 50) return "bg-red-500";
  if (score <= 80) return "bg-yellow-500";
  return "bg-green-500";
}
