"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, RefreshCw, Share2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ScoreCelebrationBanner } from "@/components/scan/score-celebration-banner";
import { FixProgressTracker } from "@/components/scan/fix-progress-tracker";
import {
  computeInitialExpandedPillars,
  PillarIssueGroup,
} from "@/components/scan/pillar-issue-group";
import { PillarScoreCard } from "@/components/scan/pillar-score-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  countIssuesBySeverity,
  getHealthScoreBg,
  getHealthScoreColor,
  getScoreLabel,
} from "@/lib/scan/health-score";
import { groupIssuesByPillar } from "@/lib/scan/results";
import {
  clearFixedIssues,
  markIssueFixed,
  readFixedIssueIds,
  unmarkIssueFixed,
} from "@/lib/scan/fixed-issues";
import {
  ALL_PILLARS,
  DISPLAY_PILLARS,
  type DisplayPillar,
  type Pillar,
  type PillarScores,
  type ScanIssueRow,
  type Tool,
} from "@/types";

interface ReportViewProps {
  scanId: string;
  repoName: string;
  tool: Tool;
  scanDate: string;
  status: string;
  pillarScores: PillarScores;
  issues: ScanIssueRow[];
  discoveryResponse?: string | null;
  scoreImprovement?: {
    previousScore: number;
    fixedCount: number;
  } | null;
  isQuickRescan?: boolean;
  discoveryAgeLabel?: string;
  canQuickRescan?: boolean;
}

function SummaryBadges({ counts }: { counts: ReturnType<typeof countIssuesBySeverity> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {counts.critical > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
          🔴 {counts.critical} Critical
        </span>
      )}
      {counts.warning > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
          🟡 {counts.warning} Warning
        </span>
      )}
      {counts.info > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-sm text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
          ⚫ {counts.info} Info
        </span>
      )}
    </div>
  );
}

export function ReportView({
  scanId,
  repoName,
  tool,
  scanDate,
  status,
  pillarScores,
  issues,
  discoveryResponse,
  scoreImprovement = null,
  isQuickRescan = false,
  discoveryAgeLabel,
  canQuickRescan = false,
}: ReportViewProps) {
  const router = useRouter();
  const [fixedIssueIds, setFixedIssueIds] = useState<string[]>([]);
  const counts = countIssuesBySeverity(issues);
  const grouped = groupIssuesByPillar(issues);
  const scoreLabel = getScoreLabel(pillarScores.overall);
  const rescanHref = `/scan/new?repo=${encodeURIComponent(repoName)}&mode=${canQuickRescan ? "quick" : "full"}`;

  const initialExpanded = useMemo(
    () => computeInitialExpandedPillars(grouped, ALL_PILLARS),
    [grouped]
  );

  const [expandedPillars, setExpandedPillars] = useState<Set<Pillar>>(
    () => initialExpanded
  );

  useEffect(() => {
    setFixedIssueIds(readFixedIssueIds(scanId));
  }, [scanId]);

  const handleToggleFixed = useCallback(
    (issueId: string) => {
      setFixedIssueIds((current) => {
        const isCurrentlyFixed = current.includes(issueId);
        return isCurrentlyFixed
          ? unmarkIssueFixed(scanId, issueId)
          : markIssueFixed(scanId, issueId);
      });
    },
    [scanId]
  );

  const handleRescanClick = useCallback(() => {
    clearFixedIssues(scanId);
  }, [scanId]);

  const togglePillar = (pillarId: Pillar) => {
    setExpandedPillars((prev) => {
      const next = new Set(prev);
      if (next.has(pillarId)) next.delete(pillarId);
      else next.add(pillarId);
      return next;
    });
  };

  const scrollToPillar = (pillar: DisplayPillar) => {
    setExpandedPillars((prev) => new Set(prev).add(pillar));
    requestAnimationFrame(() => {
      document.getElementById(`pillar-${pillar}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Report link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div>
      {scoreImprovement ? (
        <ScoreCelebrationBanner
          previousScore={scoreImprovement.previousScore}
          currentScore={pillarScores.overall}
          fixedCount={scoreImprovement.fixedCount}
          remainingCount={issues.length}
        />
      ) : null}

      {/* 1. Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-7 text-foreground" />
            <span className="text-lg font-semibold text-foreground">ShipProof</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {repoName}
          </h1>
          <div className="mt-2">
            {isQuickRescan ? (
              <Badge variant="outline" className="text-xs font-normal">
                ⚡ Quick Rescan · Discovery from {discoveryAgeLabel ?? "previous scan"}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-normal">
                🔄 Full Rescan · Fresh discovery
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Built with {tool}</span>
            <span>·</span>
            <span>Scanned {scanDate}</span>
            <Badge variant="outline">{status}</Badge>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div
            className={`flex size-32 flex-col items-center justify-center rounded-full border-4 ${getHealthScoreBg(pillarScores.overall)}`}
          >
            <span
              className={`text-4xl font-bold ${getHealthScoreColor(pillarScores.overall)}`}
            >
              {pillarScores.overall}
            </span>
          </div>
          <p
            className={`mt-3 text-sm font-semibold ${getHealthScoreColor(pillarScores.overall)}`}
          >
            {scoreLabel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on {pillarScores.scoredPillarCount ?? 0} of{" "}
            {pillarScores.totalPillarCount ?? 8} pillars with sufficient data
          </p>
        </div>
      </div>

      {/* 2. Pillar score cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {DISPLAY_PILLARS.map(({ id, label }) => (
          <PillarScoreCard
            key={id}
            pillarId={id}
            label={label}
            pillarScores={pillarScores}
            onClick={() => scrollToPillar(id)}
          />
        ))}
      </div>

      {/* 3. Summary counts */}
      {issues.length > 0 ? (
        <div className="mb-6 space-y-3">
          <p className="text-base font-semibold text-foreground">
            {counts.total} total issue{counts.total === 1 ? "" : "s"} found
          </p>
          <SummaryBadges counts={counts} />
        </div>
      ) : null}

      {/* 4. Issues grouped by pillar */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ShieldCheck className="size-12 text-green-600" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Great news! No issues found.
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Your app looks production ready! No security or DevOps issues were
              detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <FixProgressTracker
            fixedCount={fixedIssueIds.length}
            totalCount={issues.length}
            rescanHref={rescanHref}
            onRescanClick={handleRescanClick}
          />

          {ALL_PILLARS.map(({ id, label }) => (
            <PillarIssueGroup
              key={id}
              pillarId={id}
              label={label}
              issues={grouped[id]}
              pillarScores={pillarScores}
              tool={tool}
              discoveryResponse={discoveryResponse}
              fixedIssueIds={fixedIssueIds}
              isOpen={expandedPillars.has(id)}
              onToggle={() => togglePillar(id)}
              onToggleFixed={handleToggleFixed}
            />
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={rescanHref} onClick={handleRescanClick}>
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <RefreshCw className="size-4" />
              Rescan
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleShare}
          >
            <Share2 className="size-4" />
            Share Report
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          ShipProof analyzes up to 15 files from your repository. Pillars marked
          ⚠️ had limited data. Results may vary slightly between scans — apply fix
          prompts before rescanning for best results.
        </p>
      </div>
    </div>
  );
}
