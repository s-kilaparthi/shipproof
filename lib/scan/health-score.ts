import type { Pillar, PillarScores } from "@/types";

export interface IssueCount {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

export interface HealthScoreBreakdown {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  criticalDeduction: number;
  warningDeduction: number;
  infoDeduction: number;
  rawScore: number;
  pillarCap: number | null;
  finalScore: number;
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

function hasCriticalInPillar(
  issues: { severity: string; pillar?: string }[],
  pillar: Pillar
): boolean {
  return issues.some(
    (issue) =>
      issue.pillar === pillar && issue.severity.toLowerCase() === "critical"
  );
}

function hasCriticalInOtherPillars(
  issues: { severity: string; pillar?: string }[]
): boolean {
  const cappedPillars: Pillar[] = ["security", "database"];
  return issues.some(
    (issue) =>
      issue.severity.toLowerCase() === "critical" &&
      issue.pillar != null &&
      !cappedPillars.includes(issue.pillar as Pillar)
  );
}

function getOverallPillarCap(
  issues: { severity: string; pillar?: string }[]
): number | null {
  let cap: number | null = null;

  if (hasCriticalInPillar(issues, "security")) {
    cap = cap == null ? 40 : Math.min(cap, 40);
  }
  if (hasCriticalInPillar(issues, "database")) {
    cap = cap == null ? 60 : Math.min(cap, 60);
  }
  if (hasCriticalInOtherPillars(issues)) {
    cap = cap == null ? 70 : Math.min(cap, 70);
  }

  return cap;
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

export function calculateHealthScoreBreakdown(
  issues: { severity: string; pillar?: string }[]
): HealthScoreBreakdown {
  const counts = countIssuesBySeverity(issues);
  const criticalDeduction = counts.critical * 15;
  const warningDeduction = counts.warning * 7;
  const infoDeduction = counts.info * 2;
  const rawScore = Math.max(
    0,
    100 - criticalDeduction - warningDeduction - infoDeduction
  );
  const pillarCap = getOverallPillarCap(issues);
  const finalScore =
    pillarCap != null ? Math.min(rawScore, pillarCap) : rawScore;

  return {
    criticalCount: counts.critical,
    warningCount: counts.warning,
    infoCount: counts.info,
    criticalDeduction,
    warningDeduction,
    infoDeduction,
    rawScore,
    pillarCap,
    finalScore,
  };
}

export function calculateHealthScores(
  issues: { severity: string; pillar?: string }[]
): PillarScores {
  const breakdown = calculateHealthScoreBreakdown(issues);

  return {
    overall: breakdown.finalScore,
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

export function getDashboardScoreBadgeClass(score: number): string {
  const base =
    "flex size-14 shrink-0 items-center justify-center rounded-full border text-xl font-bold";

  if (score < 50) {
    return `${base} bg-red-50 border-red-200 text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-400`;
  }
  if (score <= 79) {
    return `${base} bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400`;
  }
  return `${base} bg-green-50 border-green-200 text-green-600 dark:bg-green-950 dark:border-green-800 dark:text-green-400`;
}

export function getHealthScoreColor(score: number): string {
  if (score < 50) return "text-red-600";
  if (score <= 80) return "text-amber-600";
  return "text-green-600";
}

export function getHealthScoreBg(score: number): string {
  if (score < 50) return "bg-red-100 text-red-700 border-red-200";
  if (score <= 80) return "bg-amber-100 text-amber-700 border-amber-200";
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
  if (s === "warning") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

export function getPillarDotColor(score: number): string {
  if (score < 50) return "bg-red-500";
  if (score <= 80) return "bg-amber-500";
  return "bg-green-500";
}
