import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { redirect } from "next/navigation";

import { ScanHistory } from "@/components/dashboard/scan-history";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  getDiscoveryAgeDays,
  getDiscoveryReferenceDate,
  requiresFreshDiscovery,
} from "@/lib/scan/discovery-cache";
import { calculateHealthScores } from "@/lib/scan/health-score";
import { normalizeScanIssues, parsePillarScores } from "@/lib/scan/results";
import { createServerClient } from "@/lib/supabase/server";

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

  const repoDiscoveryStatus = new Map<string, { canQuickRescan: boolean }>();

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

  const scanHistoryGroups = repoGroups.map(([repoName, repoScans]) => ({
    repoName,
    canQuickRescan: repoDiscoveryStatus.get(repoName)?.canQuickRescan ?? false,
    scans: repoScans.map(({ scan, issues, pillarScores }) => ({
      scan: {
        id: scan.id,
        tool_selected: scan.tool_selected,
        status: scan.status,
        created_at: scan.created_at,
        repo_name: scan.repo_name,
      },
      issueCount: issues.length,
      pillarScores,
    })),
  }));

  return (
    <main className="mx-auto max-w-6xl bg-background px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome to ShipProof
          </h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
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
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-muted/30 px-6 py-16 text-center dark:border-gray-800">
          <ScanSearch className="size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium text-foreground">No scans yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Connect a GitHub repository and run your first security scan to see
            results here.
          </p>
        </div>
      ) : (
        <ScanHistory repoGroups={scanHistoryGroups} />
      )}
    </main>
  );
}
