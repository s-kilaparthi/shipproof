import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { redirect } from "next/navigation";

import { OnboardingWelcome } from "@/components/dashboard/onboarding-welcome";
import { ScanHistory } from "@/components/dashboard/scan-history";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  getDiscoveryAgeDays,
  getDiscoveryReferenceDate,
  requiresFreshDiscovery,
} from "@/lib/scan/discovery-cache";
import { normalizeScanIssues, parsePillarScores } from "@/lib/scan/results";
import { createServerClient } from "@/lib/supabase/server";

function getFirstName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined);
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? "there";
  }
  if (user.email) {
    return user.email.split("@")[0] ?? "there";
  }
  return "there";
}

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

  if (!scans || scans.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
          <ThemeToggle />
          <SignOutButton />
        </div>
        <OnboardingWelcome firstName={getFirstName(user)} />
      </main>
    );
  }

  const scansWithResults = await Promise.all(
    scans.map(async (scan) => {
      const { data: resultRows } = await supabase
        .from("scan_results")
        .select("*")
        .eq("scan_id", scan.id)
        .limit(200);

      const issues = normalizeScanIssues(resultRows ?? [], scan.id);
      const pillarScores = parsePillarScores(scan.pillar_scores, issues);

      if (scan.overall_score != null) {
        pillarScores.overall = scan.overall_score;
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

      <ScanHistory repoGroups={scanHistoryGroups} />
    </main>
  );
}
