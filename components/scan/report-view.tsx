"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { IssueCard } from "@/components/scan/issue-card";
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
  ALL_PILLARS,
  DISPLAY_PILLARS,
  type DisplayPillar,
  type PillarScores,
  type ScanIssueRow,
  type Tool,
} from "@/types";

interface ReportViewProps {
  repoName: string;
  tool: Tool;
  scanDate: string;
  status: string;
  pillarScores: PillarScores;
  issues: ScanIssueRow[];
}

export function ReportView({
  repoName,
  tool,
  scanDate,
  status,
  pillarScores,
  issues,
}: ReportViewProps) {
  const router = useRouter();
  const counts = countIssuesBySeverity(issues);
  const grouped = groupIssuesByPillar(issues);
  const scoreLabel = getScoreLabel(pillarScores.overall);

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
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-7 text-primary" />
            <span className="text-lg font-semibold">ShipProof</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {repoName}
          </h1>
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
        </div>
      </div>

      {/* Pillar score cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {DISPLAY_PILLARS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToPillar(id)}
            className={`rounded-xl border p-4 text-left transition-all hover:ring-2 hover:ring-primary/20 ${getHealthScoreBg(pillarScores[id])}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
              {label}
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${getHealthScoreColor(pillarScores[id])}`}
            >
              {pillarScores[id]}
            </p>
          </button>
        ))}
      </div>

      {/* Issues by pillar */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ShieldCheck className="size-12 text-green-600" />
            <h2 className="mt-4 text-xl font-semibold">
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
                    <h2 className="text-lg font-semibold">{label}</h2>
                    <Badge
                      variant="outline"
                      className={getHealthScoreBg(pillarScores[id])}
                    >
                      Score: {pillarScores[id]}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {grouped[id].map((issue) => (
                      <IssueCard key={issue.id} issue={issue} tool={tool} />
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
        <h3 className="font-semibold">Summary</h3>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{counts.total} total issues</span>
          <span className="text-red-600">{counts.critical} critical</span>
          <span className="text-yellow-600">{counts.warning} warning</span>
          <span className="text-blue-600">{counts.info} info</span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/scan/new">
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
    </div>
  );
}
