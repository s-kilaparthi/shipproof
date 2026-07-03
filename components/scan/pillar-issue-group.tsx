"use client";

import { ChevronDown, Info } from "lucide-react";

import { IssueCard } from "@/components/scan/issue-card";
import {
  countIssuesBySeverity,
  getPillarConfidenceLabel,
  getPillarDisplayScore,
  getPillarScoreDetail,
} from "@/lib/scan/health-score";
import type { SkipReason } from "@/lib/scan/skipped-issues";
import { cn } from "@/lib/utils";
import type { Pillar, PillarScores, ScanIssueRow, Tool } from "@/types";

interface PillarIssueGroupProps {
  pillarId: Pillar;
  label: string;
  issues: ScanIssueRow[];
  pillarScores: PillarScores;
  tool: Tool;
  fixedIssueIds: string[];
  skippedIssueIds: string[];
  isOpen: boolean;
  onToggle: () => void;
  onToggleFixed: (issueId: string) => void;
  onSkipIssue: (issueId: string, reason: SkipReason) => void;
}

function SeverityCounts({
  counts,
}: {
  counts: ReturnType<typeof countIssuesBySeverity>;
}) {
  if (counts.total === 0) return null;

  const items = [
    counts.critical > 0 && { dot: "bg-red-500", count: counts.critical },
    counts.warning > 0 && { dot: "bg-amber-500", count: counts.warning },
    counts.info > 0 && { dot: "bg-gray-500", count: counts.info },
  ].filter(Boolean) as { dot: string; count: number }[];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map(({ dot, count }, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 text-xs text-gray-400"
        >
          <span className={cn("size-1.5 rounded-full", dot)} />
          {count}
        </span>
      ))}
    </div>
  );
}

function PillarScoreLabel({
  pillarScores,
  pillarId,
}: {
  pillarScores: PillarScores;
  pillarId: Pillar;
}) {
  const detail = getPillarScoreDetail(pillarScores, pillarId);
  const displayScore = getPillarDisplayScore(detail);
  const tooltip = getPillarConfidenceLabel(detail.confidence);
  const showInfo =
    detail.confidence === "insufficient" ||
    detail.confidence === "low" ||
    detail.confidence === "medium";

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
      Score: {displayScore}
      {showInfo ? (
        <span title={tooltip} className="inline-flex">
          <Info className="size-3.5 text-gray-400" />
        </span>
      ) : null}
    </span>
  );
}

export function PillarIssueGroup({
  pillarId,
  label,
  issues,
  pillarScores,
  tool,
  fixedIssueIds,
  skippedIssueIds,
  isOpen,
  onToggle,
  onToggleFixed,
  onSkipIssue,
}: PillarIssueGroupProps) {
  const activeIssues = issues.filter((issue) => !skippedIssueIds.includes(issue.id));
  const counts = countIssuesBySeverity(activeIssues);
  const hasIssues = counts.total > 0;

  if (!hasIssues) {
    return (
      <div
        id={`pillar-${pillarId}`}
        className="scroll-mt-24 flex flex-col gap-2 border-b border-gray-100 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
            {label}
          </span>
          <span className="text-xs text-gray-400">✓ No issues found</span>
        </div>
        <PillarScoreLabel pillarScores={pillarScores} pillarId={pillarId} />
      </div>
    );
  }

  return (
    <section
      id={`pillar-${pillarId}`}
      className="scroll-mt-24 border-b border-gray-100 dark:border-gray-800"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer flex-col gap-2 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-gray-400 transition-transform duration-200",
              isOpen ? "rotate-0" : "-rotate-90"
            )}
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </span>
          <SeverityCounts counts={counts} />
        </div>
        <PillarScoreLabel pillarScores={pillarScores} pillarId={pillarId} />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pb-4 pl-4">
            {activeIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                tool={tool}
                isFixed={fixedIssueIds.includes(issue.id)}
                onToggleFixed={() => onToggleFixed(issue.id)}
                onSkip={(reason) => onSkipIssue(issue.id, reason)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function computeInitialExpandedPillars(
  grouped: Record<Pillar, ScanIssueRow[]>,
  allPillars: { id: Pillar; label: string }[]
): Set<Pillar> {
  const withIssues = allPillars.filter(({ id }) => grouped[id].length > 0);
  if (withIssues.length === 0) return new Set();
  if (withIssues.length === 1) return new Set([withIssues[0].id]);
  if (grouped.security.length > 0) return new Set(["security"]);
  return new Set();
}
