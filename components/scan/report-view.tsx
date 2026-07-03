"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Share2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ScoreCelebrationBanner } from "@/components/scan/score-celebration-banner";
import { FixProgressTracker } from "@/components/scan/fix-progress-tracker";
import {
  computeInitialExpandedPillars,
  PillarIssueGroup,
} from "@/components/scan/pillar-issue-group";
import { PillarScoreCard } from "@/components/scan/pillar-score-card";
import { SkippedIssuesSection } from "@/components/scan/skipped-issues-section";
import { Button } from "@/components/ui/button";
import { countIssuesBySeverity, getScoreLabel } from "@/lib/scan/health-score";
import { groupIssuesByPillar } from "@/lib/scan/results";
import {
  clearFixedIssues,
  markIssueFixed,
  readFixedIssueIds,
  unmarkIssueFixed,
} from "@/lib/scan/fixed-issues";
import {
  clearSkippedIssues,
  markIssueSkipped,
  readSkippedIssues,
  unmarkIssueSkipped,
  type SkipReason,
} from "@/lib/scan/skipped-issues";
import { cn } from "@/lib/utils";
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
  scoreImprovement?: {
    previousScore: number;
    fixedCount: number;
  } | null;
  isQuickRescan?: boolean;
  discoveryAgeLabel?: string;
  canQuickRescan?: boolean;
}

function getScoreCircleClasses(score: number): {
  border: string;
  text: string;
} {
  if (score < 50) {
    return { border: "border-red-300", text: "text-red-500" };
  }
  if (score <= 79) {
    return { border: "border-amber-300", text: "text-amber-500" };
  }
  return {
    border: "border-green-300",
    text: "text-green-500 dark:text-green-400",
  };
}

function SummaryCounts({
  counts,
  skippedCount = 0,
}: {
  counts: ReturnType<typeof countIssuesBySeverity>;
  skippedCount?: number;
}) {
  const parts: ReactNode[] = [];

  if (counts.critical > 0) {
    parts.push(
      <span key="critical" className="font-semibold text-red-500">
        {counts.critical} critical
      </span>
    );
  }
  if (counts.warning > 0) {
    parts.push(
      <span key="warning" className="font-semibold text-amber-500">
        {counts.warning} warning{counts.warning === 1 ? "" : "s"}
      </span>
    );
  }
  if (counts.info > 0) {
    parts.push(
      <span key="info" className="font-semibold text-gray-500">
        {counts.info} info
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <p className="flex flex-wrap items-center gap-x-2 text-sm">
        {parts.map((part, index) => (
          <span key={index} className="inline-flex items-center gap-2">
            {index > 0 ? (
              <span className="text-gray-300 dark:text-gray-600">·</span>
            ) : null}
            {part}
          </span>
        ))}
      </p>
      {skippedCount > 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          ({skippedCount} issue{skippedCount === 1 ? "" : "s"} skipped)
        </p>
      ) : null}
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
  scoreImprovement = null,
  isQuickRescan = false,
  discoveryAgeLabel,
  canQuickRescan = false,
}: ReportViewProps) {
  const router = useRouter();
  const [fixedIssueIds, setFixedIssueIds] = useState<string[]>([]);
  const [skippedIssues, setSkippedIssues] = useState<Record<string, SkipReason>>({});
  const skippedIssueIds = useMemo(
    () => Object.keys(skippedIssues),
    [skippedIssues]
  );
  const activeIssues = useMemo(
    () => issues.filter((issue) => !skippedIssueIds.includes(issue.id)),
    [issues, skippedIssueIds]
  );
  const counts = countIssuesBySeverity(activeIssues);
  const grouped = groupIssuesByPillar(issues);
  const scoreLabel = getScoreLabel(pillarScores.overall);
  const scoreCircle = getScoreCircleClasses(pillarScores.overall);
  const rescanHref = `/scan/new?repo=${encodeURIComponent(repoName)}&mode=${canQuickRescan ? "quick" : "full"}`;

  const initialExpanded = useMemo(() => {
    const activeGrouped = groupIssuesByPillar(activeIssues);
    return computeInitialExpandedPillars(activeGrouped, ALL_PILLARS);
  }, [activeIssues]);

  const [expandedPillars, setExpandedPillars] = useState<Set<Pillar>>(
    () => initialExpanded
  );

  useEffect(() => {
    setFixedIssueIds(readFixedIssueIds(scanId));
    setSkippedIssues(readSkippedIssues(scanId));
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

  const handleSkipIssue = useCallback(
    (issueId: string, reason: SkipReason) => {
      setSkippedIssues(markIssueSkipped(scanId, issueId, reason));
    },
    [scanId]
  );

  const handleUnskipIssue = useCallback(
    (issueId: string) => {
      setSkippedIssues(unmarkIssueSkipped(scanId, issueId));
    },
    [scanId]
  );

  const handleRescanClick = useCallback(() => {
    clearFixedIssues(scanId);
    clearSkippedIssues(scanId);
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
    try {
      await navigator.clipboard.writeText(window.location.href);
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
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <ShieldCheck className="size-5" />
            <span className="text-sm font-medium">ShipProof</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {repoName}
          </h1>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {isQuickRescan
              ? `Quick rescan · discovery from ${discoveryAgeLabel ?? "previous scan"}`
              : "Full rescan · fresh discovery"}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Built with {tool} · Scanned {scanDate} · {status}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div
            className={cn(
              "flex size-24 flex-col items-center justify-center rounded-full border-2 bg-transparent",
              scoreCircle.border
            )}
          >
            <span className={cn("text-3xl font-bold", scoreCircle.text)}>
              {pillarScores.overall}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {scoreLabel}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {pillarScores.scoredPillarCount ?? 0} of{" "}
            {pillarScores.totalPillarCount ?? 8} pillars scored
          </p>
        </div>
      </div>

      {/* 2. Pillar score cards */}
      <div className="mb-8 grid grid-cols-2 gap-px border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800 sm:grid-cols-3 lg:grid-cols-6">
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

      {/* 3. Summary */}
      {issues.length > 0 ? (
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {issues.length} total issue{issues.length === 1 ? "" : "s"} found
          </h2>
          <SummaryCounts counts={counts} skippedCount={skippedIssueIds.length} />
        </div>
      ) : null}

      {/* 4. Issues */}
      {issues.length === 0 ? (
        <div className="border border-gray-100 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900/20">
          <ShieldCheck className="mx-auto size-10 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            No issues found
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your app looks production ready based on this scan.
          </p>
        </div>
      ) : (
        <>
          <FixProgressTracker
            fixedCount={fixedIssueIds.length}
            totalCount={activeIssues.length}
            rescanHref={rescanHref}
            onRescanClick={handleRescanClick}
          />

          <div className="border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/20">
            {ALL_PILLARS.map(({ id, label }) => (
              <PillarIssueGroup
                key={id}
                pillarId={id}
                label={label}
                issues={grouped[id]}
                pillarScores={pillarScores}
                tool={tool}
                fixedIssueIds={fixedIssueIds}
                skippedIssueIds={skippedIssueIds}
                isOpen={expandedPillars.has(id)}
                onToggle={() => togglePillar(id)}
                onToggleFixed={handleToggleFixed}
                onSkipIssue={handleSkipIssue}
              />
            ))}
          </div>

          <SkippedIssuesSection
            issues={issues}
            skippedIssues={skippedIssues}
            tool={tool}
            onUnskip={handleUnskipIssue}
          />
        </>
      )}

      {/* Footer */}
      <div className="mt-10 border-t border-gray-100 pt-6 dark:border-gray-800">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={rescanHref} onClick={handleRescanClick}>
            <Button
              variant="outline"
              className="w-full gap-2 border-gray-200 bg-transparent text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900 sm:w-auto"
            >
              <RefreshCw className="size-4" />
              Rescan
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-gray-200 bg-transparent text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
            onClick={handleShare}
          >
            <Share2 className="size-4" />
            Share report
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </Button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
          ShipProof analyzes up to 15 files from your repository. Apply fix prompts
          before rescanning for best results.
        </p>
      </div>
    </div>
  );
}
