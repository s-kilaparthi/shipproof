import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { OnboardingWelcome } from "@/components/dashboard/onboarding-welcome";
import { ScanHistory } from "@/components/dashboard/scan-history";
import { StartNewScan } from "@/components/dashboard/start-new-scan";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getDiscoveryAgeDays,
  getDiscoveryReferenceDate,
  requiresFreshDiscovery,
} from "@/lib/scan/discovery-cache";
import { getScanLimitStatus } from "@/lib/scan/scan-limit";
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

function DashboardTopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-black sm:hidden">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-foreground"
      >
        <ShieldCheck className="size-5" />
        ShipProof
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <SignOutButton iconOnly />
      </div>
    </header>
  );
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
      <main className="min-h-screen overflow-x-hidden bg-background">
        <DashboardTopBar />
        <div className="absolute right-4 top-4 hidden items-center gap-2 sm:flex sm:right-6 sm:top-6">
          <ThemeToggle />
          <SignOutButton />
        </div>
        <div className="pt-14 sm:pt-0">
          <OnboardingWelcome firstName={getFirstName(user)} />
        </div>
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

  const { data: userProfile } = await supabase
    .from("users")
    .select("plan, total_scans_used")
    .eq("id", user.id)
    .maybeSingle();

  const limitStatus = getScanLimitStatus(
    userProfile?.plan,
    userProfile?.total_scans_used
  );

  const latestCompleted = scansWithResults.find(
    (item) => item.scan.status === "completed"
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <DashboardTopBar />

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-12">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome to ShipProof
            </h1>
            <p className="mt-2 truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>

        <div className="mt-8">
          <StartNewScan
            canScan={limitStatus.can_scan}
            lastScanId={latestCompleted?.scan.id ?? scansWithResults[0]?.scan.id}
            lastIssueCount={
              latestCompleted?.issues.length ??
              scansWithResults[0]?.issues.length ??
              0
            }
          />
        </div>

        <ScanHistory repoGroups={scanHistoryGroups} />
      </div>
    </main>
  );
}
