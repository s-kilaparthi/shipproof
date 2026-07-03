import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ReportView } from "@/components/scan/report-view";
import {
  formatDiscoveryAge,
  getDiscoveryAgeDays,
  getDiscoveryReferenceDate,
  isQuickRescanScan,
  requiresFreshDiscovery,
} from "@/lib/scan/discovery-cache";
import { normalizeScanIssues, parsePillarScores } from "@/lib/scan/results";
import { createServerClient } from "@/lib/supabase/server";
import type { PillarScores, Tool } from "@/types";

interface ReportPageProps {
  params: { id: string };
}

export default async function ScanReportPage({ params }: ReportPageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (scanError || !scan) {
    redirect("/dashboard");
  }

  const { data: resultRows } = await supabase
    .from("scan_results")
    .select("*")
    .eq("scan_id", scan.id)
    .order("created_at", { ascending: true })
    .limit(200);

  const issues = normalizeScanIssues(resultRows ?? [], scan.id);
  const pillarScores: PillarScores = parsePillarScores(
    scan.pillar_scores,
    issues
  );

  const { data: previousScan } = await supabase
    .from("scans")
    .select("id, overall_score")
    .eq("user_id", user.id)
    .eq("repo_name", scan.repo_name)
    .eq("status", "completed")
    .neq("id", scan.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let scoreImprovement: {
    previousScore: number;
    fixedCount: number;
  } | null = null;

  if (
    previousScan?.overall_score != null &&
    scan.overall_score != null &&
    scan.overall_score > previousScan.overall_score
  ) {
    const { count: previousIssueCount } = await supabase
      .from("scan_results")
      .select("*", { count: "exact", head: true })
      .eq("scan_id", previousScan.id);

    scoreImprovement = {
      previousScore: previousScan.overall_score,
      fixedCount: Math.max(0, (previousIssueCount ?? 0) - issues.length),
    };
  }

  if (scan.overall_score != null && scan.pillar_scores && !issues.length) {
    pillarScores.overall = scan.overall_score;
  }

  const scanDate = new Date(
    scan.completed_at ?? scan.created_at
  ).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const quickRescan =
    scan.used_cached_discovery === true ||
    (scan.used_cached_discovery == null && isQuickRescanScan(scan));
  const discoveryRef = getDiscoveryReferenceDate(scan);
  const canQuickRescan = !requiresFreshDiscovery(
    getDiscoveryAgeDays(discoveryRef)
  );
  const discoveryAgeLabel = quickRescan
    ? formatDiscoveryAge(discoveryRef, new Date(scan.created_at))
    : undefined;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <ReportView
        scanId={scan.id}
        repoName={scan.repo_name}
        tool={scan.tool_selected as Tool}
        scanDate={scanDate}
        status={scan.status}
        pillarScores={pillarScores}
        issues={issues}
        scoreImprovement={scoreImprovement}
        isQuickRescan={quickRescan}
        discoveryAgeLabel={discoveryAgeLabel}
        canQuickRescan={canQuickRescan}
        />
      </div>
    </main>
  );
}
