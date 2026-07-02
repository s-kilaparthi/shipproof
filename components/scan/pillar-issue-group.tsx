"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

import { IssueCard } from "@/components/scan/issue-card";
import {
  countIssuesBySeverity,
  getPillarDisplayScore,
  getPillarScoreDetail,
} from "@/lib/scan/health-score";
import { cn } from "@/lib/utils";
import type { Pillar, PillarScores, ScanIssueRow, Tool } from "@/types";

interface PillarIssueGroupProps {
  pillarId: Pillar;
  label: string;
  issues: ScanIssueRow[];
  pillarScores: PillarScores;
  tool: Tool;
  discoveryResponse?: string | null;
  fixedIssueIds: string[];
  isOpen: boolean;
  onToggle: () => void;
  onToggleFixed: (issueId: string) => void;
}

function SeverityCountBadges({
  counts,
  compact = false,
}: {
  counts: ReturnType<typeof countIssuesBySeverity>;
  compact?: boolean;
}) {
  if (counts.total === 0) return null;

  const items = [
    counts.critical > 0 && { emoji: "🔴", count: counts.critical, label: "critical" },
    counts.warning > 0 && { emoji: "🟡", count: counts.warning, label: "warning" },
    counts.info > 0 && { emoji: "⚫", count: counts.info, label: "info" },
  ].filter(Boolean) as { emoji: string; count: number; label: string }[];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ emoji, count, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          {emoji}
          {count}
          {!compact && <span className="hidden sm:inline">{label}</span>}
        </span>
      ))}
    </div>
  );
}

function PillarScoreLabel({
  pillarScores,
  pillarId,
  noIssues = false,
}: {
  pillarScores: PillarScores;
  pillarId: Pillar;
  noIssues?: boolean;
}) {
  const detail = getPillarScoreDetail(pillarScores, pillarId);
  const displayScore = getPillarDisplayScore(detail);

  let suffix = "";
  if (noIssues && displayScore === "100") {
    suffix = " ✓";
  } else if (detail.confidence === "insufficient" || detail.confidence === "low") {
    suffix = " ⚠️";
  } else if (detail.confidence === "medium") {
    suffix = " ℹ️";
  }

  return (
    <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
      Score: {displayScore}
      {suffix}
    </span>
  );
}

export function PillarIssueGroup({
  pillarId,
  label,
  issues,
  pillarScores,
  tool,
  discoveryResponse,
  fixedIssueIds,
  isOpen,
  onToggle,
  onToggleFixed,
}: PillarIssueGroupProps) {
  const counts = countIssuesBySeverity(issues);
  const hasIssues = counts.total > 0;

  if (!hasIssues) {
    return (
      <div
        id={`pillar-${pillarId}`}
        className="scroll-mt-24 flex flex-col gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronRight className="size-4 shrink-0 opacity-40" />
          <span className="font-medium text-foreground/70">{label}</span>
          <span className="text-muted-foreground">✅ No issues found</span>
        </div>
        <PillarScoreLabel pillarScores={pillarScores} pillarId={pillarId} noIssues />
      </div>
    );
  }

  return (
    <section id={`pillar-${pillarId}`} className="scroll-mt-24 overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full flex-col gap-3 px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:justify-between",
          isOpen
            ? "bg-background"
            : "bg-muted/30 hover:bg-muted/50"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen ? "rotate-0" : "-rotate-90"
            )}
          />
          <span className="font-semibold text-foreground">{label}</span>
          <SeverityCountBadges counts={counts} compact />
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
          <div className="space-y-4 border-t border-border bg-background px-4 py-4">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                tool={tool}
                discoveryResponse={discoveryResponse}
                isFixed={fixedIssueIds.includes(issue.id)}
                onToggleFixed={() => onToggleFixed(issue.id)}
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
