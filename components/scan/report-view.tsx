"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, RefreshCw, Share2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ScoreCelebrationBanner } from "@/components/scan/score-celebration-banner";
import { FixProgressTracker } from "@/components/scan/fix-progress-tracker";
import { IssueCard } from "@/components/scan/issue-card";
import { PillarScoreCard } from "@/components/scan/pillar-score-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  countIssuesBySeverity,
  getHealthScoreBg,
  getHealthScoreColor,
  getPillarDisplayScore,
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
  stackSummary?: string;
  scoreImprovement?: {
    previousScore: number;
    fixedCount: number;
  } | null;
  isQuickRescan?: boolean;
  discoveryAgeLabel?: string;
  canQuickRescan?: boolean;
}

export function ReportView({
  scanId,
  repoName,
  tool,
  scanDate,
  status,
  pillarScores,
  issues,
  stackSummary = "Unknown stack",
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

  useEffect(() => {
    setFixedIssueIds(readFixedIssueIds(scanId));
  }, [scanId]);

  const handleToggleFixed = useCallback(
    (issueId: string) => {
      setFixedIssueIds((current) => {
        const isCurrentlyFixed = current.includes(issueId);
        const next = isCurrentlyFixed
          ? unmarkIssueFixed(scanId, issueId)
          : markIssueFixed(scanId, issueId);
        return next;
      });
    },
    [scanId]
  );

  const handleRescanClick = useCallback(() => {
    clearFixedIssues(scanId);
  }, [scanId]);

  const scrollToPillar = (pillar: DisplayPillar) => {
    document.getElementById(`pillar-${pillar}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
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

      {/* Header */}
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

      {/* Pillar score cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

      <div className="mb-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">About this report</p>
        <p className="mt-2 leading-relaxed">
          ShipProof analyzes up to 15 files from your repository. Pillars marked
          ⚠️ or — had limited data available. Add more configuration files to
          your repo or provide your domain for a more complete assessment.
        </p>
        <p className="mt-2">
          <a href="/#faq" className="underline underline-offset-2 hover:text-foreground">
            Learn what we check →
          </a>
        </p>
      </div>

      {/* Issues by pillar */}
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
        <div className="space-y-10">
          <FixProgressTracker
            fixedCount={fixedIssueIds.length}
            totalCount={issues.length}
            rescanHref={rescanHref}
            onRescanClick={handleRescanClick}
          />

          {ALL_PILLARS.filter(({ id }) => grouped[id].length > 0).map(
            ({ id, label }) => {
              const displayId = DISPLAY_PILLARS.some((p) => p.id === id)
                ? id
                : id;
              return (
                <section
                  key={id}
                  id={`pillar-${displayId}`}
                  className="scroll-mt-24"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-muted-foreground">{label}</h2>
                    <Badge
                      variant="outline"
                      className={getHealthScoreBg(pillarScores[id])}
                    >
                      Score: {getPillarDisplayScore(pillarScores[id])}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {grouped[id].map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        tool={tool}
                        stackSummary={stackSummary}
                        isFixed={fixedIssueIds.includes(issue.id)}
                        onToggleFixed={() => handleToggleFixed(issue.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            }
          )}
        </div>
      )}

      {/* Summary footer */}
      <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6">
        <h3 className="font-semibold text-foreground">Summary</h3>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{counts.total} total issues</span>
          <span className="text-red-600">{counts.critical} critical</span>
          <span className="text-amber-600">{counts.warning} warning</span>
          <span className="text-gray-500">{counts.info} info</span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={rescanHref}
            onClick={handleRescanClick}
          >
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

      <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          ShipProof uses AI-powered analysis. Results may vary slightly between
          scans. For best results, apply fix prompts before rescanning.
        </p>
      </div>
    </div>
  );
}
