import type {
  DevOpsTools,
  Pillar,
  PillarConfidence,
  PillarScoreDetail,
  PillarScores,
  RepoScanMetadata,
} from "@/types";

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

export interface ScoreConfidenceContext {
  fetchedPaths: string[];
  allFilePaths: string[];
  metadata: RepoScanMetadata;
  devopsTools: DevOpsTools;
  domainProvided: boolean;
}

const SCORABLE_PILLARS: Pillar[] = [
  "security",
  "database",
  "performance",
  "reliability",
  "observability",
  "devops",
  "infrastructure",
  "dependencies",
];

const DEFAULT_PILLAR_DETAIL: PillarScoreDetail = {
  score: 100,
  confidence: "insufficient",
};

function matchesAny(path: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

function countMatches(paths: string[], patterns: RegExp[]): number {
  return paths.filter((path) => matchesAny(path, patterns)).length;
}

function hasOnlyPackageJson(paths: string[]): boolean {
  const relevant = paths.filter((path) =>
    /package\.json$|requirements\.txt$/i.test(path)
  );
  return relevant.length > 0 && paths.length <= 1;
}

const ROUTE_PATTERNS = [
  /\/app\/api\//i,
  /\/pages\/api\//i,
  /\/routes\//i,
  /\/routers\//i,
  /main\.py$/i,
  /app\.py$/i,
];

const AUTH_PATTERNS = [/auth/i, /middleware\.(ts|js)$/i];
const DB_PATTERNS = [
  /supabase/i,
  /schema/i,
  /migrations/i,
  /\.sql$/i,
  /database\.ts$/i,
  /db\.ts$/i,
];
const CONFIG_PATTERNS = [/next\.config\./i, /config\./i, /config\//i];
const OBSERVABILITY_PATTERNS = [
  /sentry/i,
  /datadog/i,
  /newrelic/i,
  /logtail/i,
  /axiom/i,
  /pino/i,
  /winston/i,
  /monitor/i,
  /logger/i,
];
const DEVOPS_PATTERNS = [
  /\.github\/workflows/i,
  /vercel\.json$/i,
  /railway\.toml$/i,
  /fly\.toml$/i,
  /docker-compose/i,
  /^Dockerfile$/i,
  /\.circleci/i,
  /netlify\.toml$/i,
  /render\.ya?ml$/i,
];

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

function calculateSecurityConfidence(
  fetchedPaths: string[],
  allFilePaths: string[]
): PillarConfidence {
  const paths = fetchedPaths.length > 0 ? fetchedPaths : allFilePaths;
  if (paths.length === 0) return "insufficient";

  const hasAuth = countMatches(paths, AUTH_PATTERNS) > 0;
  const hasRoutes = countMatches(paths, ROUTE_PATTERNS) > 0;
  const hasMiddleware = paths.some((path) => /middleware\.(ts|js)$/i.test(path));

  if (hasAuth && hasRoutes && hasMiddleware) return "high";
  if (hasRoutes) return "medium";
  if (hasOnlyPackageJson(paths)) return "low";
  if (countMatches(paths, AUTH_PATTERNS) > 0 || hasRoutes) return "medium";
  return "insufficient";
}

function calculateDatabaseConfidence(
  fetchedPaths: string[],
  allFilePaths: string[]
): PillarConfidence {
  const paths = fetchedPaths.length > 0 ? fetchedPaths : allFilePaths;
  if (paths.length === 0) return "insufficient";

  const dbMatches = countMatches(paths, DB_PATTERNS);
  const hasMigration = paths.some((path) => /migrations/i.test(path));
  const hasSchema = paths.some((path) => /schema/i.test(path));

  if (dbMatches >= 2 && (hasMigration || hasSchema)) return "high";
  if (dbMatches > 0) return "medium";
  if (hasOnlyPackageJson(paths)) return "low";
  return "insufficient";
}

function calculatePerformanceConfidence(
  fetchedPaths: string[],
  allFilePaths: string[]
): PillarConfidence {
  const paths = fetchedPaths.length > 0 ? fetchedPaths : allFilePaths;
  if (paths.length === 0) return "insufficient";

  const hasRoutes = countMatches(paths, ROUTE_PATTERNS) > 0;
  const hasConfig =
    countMatches(paths, CONFIG_PATTERNS) > 0 ||
    paths.some((path) => /next\.config\./i.test(path));

  if (hasRoutes && hasConfig) return "high";
  if (hasRoutes) return "medium";
  if (hasOnlyPackageJson(paths)) return "low";
  return "insufficient";
}

function calculateObservabilityConfidence(
  fetchedPaths: string[],
  allFilePaths: string[],
  devopsTools: DevOpsTools,
  metadata: RepoScanMetadata
): PillarConfidence {
  const paths = fetchedPaths.length > 0 ? fetchedPaths : allFilePaths;
  if (paths.length === 0 && !devopsTools.hasLogging && !metadata.hasSentry) {
    return "insufficient";
  }

  const hasObsFiles = countMatches(paths, OBSERVABILITY_PATTERNS) > 0;
  if (hasObsFiles || metadata.hasSentry) return "high";
  if (devopsTools.hasLogging || devopsTools.hasMonitoring || devopsTools.hasSentry) {
    return "medium";
  }
  if (paths.some((path) => /package\.json$/i.test(path))) return "low";
  return "insufficient";
}

function calculateDevOpsConfidence(
  allFilePaths: string[],
  devopsTools: DevOpsTools,
  metadata: RepoScanMetadata
): PillarConfidence {
  if (allFilePaths.length === 0) return "insufficient";

  const devopsFileCount = countMatches(allFilePaths, DEVOPS_PATTERNS);
  if ((metadata.hasCI || devopsTools.hasCI) && devopsFileCount >= 2) return "high";
  if (devopsFileCount >= 1 || metadata.hasDocker || devopsTools.hasDocker) {
    return "medium";
  }
  if (allFilePaths.length > 0) return "low";
  return "insufficient";
}

function calculateReliabilityConfidence(
  fetchedPaths: string[],
  allFilePaths: string[],
  devopsTools: DevOpsTools
): PillarConfidence {
  const paths = fetchedPaths.length > 0 ? fetchedPaths : allFilePaths;
  if (paths.length === 0) return "insufficient";
  if (devopsTools.hasTests) return "high";
  if (countMatches(paths, ROUTE_PATTERNS) > 0) return "medium";
  if (hasOnlyPackageJson(paths)) return "low";
  return "medium";
}

function calculateInfrastructureConfidence(domainProvided: boolean): PillarConfidence {
  return domainProvided ? "high" : "insufficient";
}

function calculateDependenciesConfidence(fetchedPaths: string[]): PillarConfidence {
  const hasDeps = fetchedPaths.some((path) =>
    /package\.json$|requirements\.txt$/i.test(path)
  );
  if (hasDeps) return "high";
  return "insufficient";
}

export function calculatePillarConfidences(
  context: ScoreConfidenceContext
): Record<Pillar, PillarConfidence> {
  const { fetchedPaths, allFilePaths, metadata, devopsTools, domainProvided } =
    context;

  return {
    security: calculateSecurityConfidence(fetchedPaths, allFilePaths),
    database: calculateDatabaseConfidence(fetchedPaths, allFilePaths),
    performance: calculatePerformanceConfidence(fetchedPaths, allFilePaths),
    reliability: calculateReliabilityConfidence(
      fetchedPaths,
      allFilePaths,
      devopsTools
    ),
    observability: calculateObservabilityConfidence(
      fetchedPaths,
      allFilePaths,
      devopsTools,
      metadata
    ),
    devops: calculateDevOpsConfidence(allFilePaths, devopsTools, metadata),
    infrastructure: calculateInfrastructureConfidence(domainProvided),
    dependencies: calculateDependenciesConfidence(fetchedPaths),
  };
}

function countsTowardOverall(confidence: PillarConfidence): boolean {
  return confidence === "high" || confidence === "medium";
}

export function getPillarScoreDetail(
  scores: PillarScores,
  pillar: Pillar
): PillarScoreDetail {
  return scores[pillar] ?? DEFAULT_PILLAR_DETAIL;
}

export function getPillarNumericScore(detail: PillarScoreDetail): number {
  return detail.confidence === "insufficient" ? 0 : detail.score;
}

export function getPillarDisplayScore(detail: PillarScoreDetail): string {
  if (detail.confidence === "insufficient") return "—";
  return String(detail.score);
}

export function isLegacyPillarScores(raw: unknown): raw is Record<string, number> {
  if (!raw || typeof raw !== "object") return false;
  const value = (raw as Record<string, unknown>).security;
  return typeof value === "number";
}

export function calculateHealthScores(
  issues: { severity: string; pillar?: string }[],
  context?: ScoreConfidenceContext & { legacyScores?: Record<string, number> }
): PillarScores {
  const confidences = context
    ? calculatePillarConfidences(context)
    : ({
        security: "medium",
        database: "medium",
        performance: "medium",
        reliability: "medium",
        observability: "medium",
        devops: "medium",
        infrastructure: "medium",
        dependencies: "medium",
      } as Record<Pillar, PillarConfidence>);

  const pillars = SCORABLE_PILLARS.reduce(
    (acc, pillar) => {
      const legacyScore = context?.legacyScores?.[pillar];
      acc[pillar] = {
        score:
          typeof legacyScore === "number"
            ? legacyScore
            : calculatePillarScore(issues, pillar),
        confidence: confidences[pillar],
      };
      return acc;
    },
    {} as Record<Pillar, PillarScoreDetail>
  );

  const scorable = SCORABLE_PILLARS.filter((pillar) =>
    countsTowardOverall(pillars[pillar].confidence)
  );

  const overallRaw =
    scorable.length > 0
      ? Math.round(
          scorable.reduce((sum, pillar) => sum + pillars[pillar].score, 0) /
            scorable.length
        )
      : calculateHealthScoreBreakdown(issues).finalScore;

  const pillarCap = getOverallPillarCap(issues);
  const overall =
    pillarCap != null ? Math.min(overallRaw, pillarCap) : overallRaw;

  return {
    overall,
    scoredPillarCount: scorable.length,
    totalPillarCount: SCORABLE_PILLARS.length,
    ...pillars,
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

export function getHealthScoreBg(score: number | PillarScoreDetail): string {
  const numeric =
    typeof score === "number" ? score : getPillarNumericScore(score);
  const confidence = typeof score === "number" ? "high" : score.confidence;

  if (confidence === "insufficient") {
    return "bg-muted text-muted-foreground border-border";
  }

  if (numeric < 50) return "bg-red-100 text-red-700 border-red-200";
  if (numeric <= 80) return "bg-amber-100 text-amber-700 border-amber-200";
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

export function getPillarDotColor(score: number | PillarScoreDetail): string {
  const numeric =
    typeof score === "number" ? score : getPillarNumericScore(score);
  const confidence = typeof score === "number" ? "high" : score.confidence;

  if (confidence === "insufficient") return "bg-gray-300 dark:bg-gray-600";
  if (numeric < 50) return "bg-red-500";
  if (numeric <= 80) return "bg-amber-500";
  return "bg-green-500";
}

export function getPillarConfidenceLabel(confidence: PillarConfidence): string {
  switch (confidence) {
    case "high":
      return "Score based on sufficient repository data";
    case "medium":
      return "Score based on partial data";
    case "low":
      return "We found limited files for this pillar. Score may not reflect actual setup.";
    case "insufficient":
      return "We couldn't find enough configuration files in your repository to score this pillar.";
  }
}

export function getPillarConfidenceHint(confidence: PillarConfidence): string {
  switch (confidence) {
    case "high":
      return "";
    case "medium":
      return "Score based on partial data";
    case "low":
      return "Limited data";
    case "insufficient":
      return "Insufficient data to score";
  }
}
