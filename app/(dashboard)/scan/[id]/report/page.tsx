import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ReportView } from "@/components/scan/report-view";
import { calculateHealthScores } from "@/lib/scan/health-score";
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
    .order("created_at", { ascending: true });

  const issues = normalizeScanIssues(resultRows ?? [], scan.id);
  const pillarScores: PillarScores = parsePillarScores(
    scan.pillar_scores,
    issues
  );

  if (scan.overall_score != null && scan.pillar_scores) {
    pillarScores.overall = scan.overall_score;
  } else if (issues.length > 0) {
    Object.assign(pillarScores, calculateHealthScores(issues));
  }

  const scanDate = new Date(
    scan.completed_at ?? scan.created_at
  ).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <ReportView
        repoName={scan.repo_name}
        tool={scan.tool_selected as Tool}
        scanDate={scanDate}
        status={scan.status}
        pillarScores={pillarScores}
        issues={issues}
      />
    </main>
  );
}
