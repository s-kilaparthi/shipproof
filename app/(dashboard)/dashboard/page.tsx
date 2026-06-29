import Link from "next/link";
import { RefreshCw, ScanSearch, Zap } from "lucide-react";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDiscoveryAgeDays,
  getDiscoveryReferenceDate,
  requiresFreshDiscovery,
} from "@/lib/scan/discovery-cache";
import {
  calculateHealthScores,
  getHealthScoreBg,
  getHealthScoreColor,
  getPillarDotColor,
} from "@/lib/scan/health-score";
import { normalizeScanIssues, parsePillarScores } from "@/lib/scan/results";
import { createServerClient } from "@/lib/supabase/server";
import { DISPLAY_PILLARS, type Tool } from "@/types";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scans } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const scansWithResults = await Promise.all(
    (scans ?? []).map(async (scan) => {
      const { data: resultRows } = await supabase
        .from("scan_results")
        .select("*")
        .eq("scan_id", scan.id);

      const issues = normalizeScanIssues(resultRows ?? [], scan.id);
      const pillarScores = parsePillarScores(scan.pillar_scores, issues);

      if (scan.overall_score != null) {
        pillarScores.overall = scan.overall_score;
      } else if (issues.length > 0) {
        Object.assign(pillarScores, calculateHealthScores(issues));
      }

      return { scan, issues, pillarScores };
    })
  );

  const scansByRepo = scansWithResults.reduce<
    Record<string, typeof scansWithResults>
  >((acc, item) => {
    const key = item.scan.repo_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const repoGroups = Object.entries(scansByRepo).sort(([, aScans], [, bScans]) => {
    const aLatest = new Date(aScans[0].scan.created_at).getTime();
    const bLatest = new Date(bScans[0].scan.created_at).getTime();
    return bLatest - aLatest;
  });

  const repoDiscoveryStatus = new Map<
    string,
    { canQuickRescan: boolean }
  >();

  for (const [repoName, repoScans] of repoGroups) {
    const latestCompleted = repoScans.find(
      (s) => s.scan.status === "completed" && s.scan.discovery_response
    );

    if (!latestCompleted) {
      repoDiscoveryStatus.set(repoName, { canQuickRescan: false });
      continue;
    }

    const referenceDate = getDiscoveryReferenceDate(latestCompleted.scan);
    const ageDays = getDiscoveryAgeDays(referenceDate);
    repoDiscoveryStatus.set(repoName, {
      canQuickRescan: !requiresFreshDiscovery(ageDays),
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome to ShipProof
          </h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8">
        <Link href="/scan/new">
          <Button className="gap-2">
            <ScanSearch className="size-4" />
            Start New Scan
          </Button>
        </Link>
      </div>

      {repoGroups.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <ScanSearch className="size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">No scans yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Connect a GitHub repository and run your first security scan to see
            results here.
          </p>
        </div>
      ) : (
        <div className="mt-12 space-y-8">
          <h2 className="text-lg font-semibold">Scan History</h2>
          {repoGroups.map(([repoName, repoScans]) => (
            <div key={repoName} className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold">{repoName}</h3>
                <span className="text-sm text-muted-foreground">
                  {repoScans.length} scan{repoScans.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-3">
                {repoScans.map(({ scan, issues, pillarScores }) => {
                  const canQuickRescan =
                    repoDiscoveryStatus.get(repoName)?.canQuickRescan ?? false;
                  const rescanMode = canQuickRescan ? "quick" : "full";
                  const rescanLabel = canQuickRescan
                    ? "Quick Rescan"
                    : "Rescan";

                  return (
                  <Card key={scan.id}>
                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{scan.tool_selected as Tool}</Badge>
                          <Badge
                            variant={
                              scan.status === "completed"
                                ? "secondary"
                                : scan.status === "failed"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {scan.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(scan.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {issues.length > 0 && (
                            <> · {issues.length} issue{issues.length === 1 ? "" : "s"}</>
                          )}
                        </p>
                        {scan.status === "completed" && (
                          <div className="flex items-center gap-1.5">
                            {DISPLAY_PILLARS.map(({ id, label }) => (
                              <span
                                key={id}
                                title={`${label}: ${pillarScores[id]}`}
                                className={`size-2.5 rounded-full ${getPillarDotColor(pillarScores[id])}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {scan.status === "completed" && (
                          <div
                            className={`rounded-lg border px-3 py-1.5 text-center ${getHealthScoreBg(pillarScores.overall)}`}
                          >
                            <span
                              className={`text-lg font-bold ${getHealthScoreColor(pillarScores.overall)}`}
                            >
                              {pillarScores.overall}
                            </span>
                          </div>
                        )}
                        {scan.status === "completed" ? (
                          <>
                            <Link href={`/scan/${scan.id}/report`}>
                              <Button variant="outline" size="sm">
                                View Report
                              </Button>
                            </Link>
                            <Link
                              href={`/scan/new?repo=${encodeURIComponent(repoName)}&mode=${rescanMode}`}
                            >
                              <Button variant="outline" size="sm" className="gap-1.5">
                                {canQuickRescan ? (
                                  <Zap className="size-3.5" />
                                ) : (
                                  <RefreshCw className="size-3.5" />
                                )}
                                {rescanLabel}
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            {scan.status === "scanning" ? "Scanning..." : "View Report"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
