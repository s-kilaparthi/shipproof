import { redirect } from "next/navigation";

import { ScanLimitReached } from "@/components/scan/scan-limit-reached";
import { ScanWizard } from "@/components/scan/scan-wizard";
import { countIssuesBySeverity } from "@/lib/scan/health-score";
import { getScanLimitStatus } from "@/lib/scan/scan-limit";
import { createServerClient } from "@/lib/supabase/server";

export default async function NewScanPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan, total_scans_used")
    .eq("id", user.id)
    .maybeSingle();

  const limitStatus = getScanLimitStatus(
    profile?.plan,
    profile?.total_scans_used
  );

  if (!limitStatus.can_scan) {
    const { data: lastScan } = await supabase
      .from("scans")
      .select("id, repo_name, overall_score, created_at, completed_at, status")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastScan) {
      redirect("/dashboard");
    }

    const { data: resultRows } = await supabase
      .from("scan_results")
      .select("severity")
      .eq("scan_id", lastScan.id)
      .limit(200);

    const counts = countIssuesBySeverity(resultRows ?? []);
    const scanDate = new Date(
      lastScan.completed_at ?? lastScan.created_at
    ).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <ScanLimitReached
        repoName={lastScan.repo_name}
        scanDate={scanDate}
        issueCount={counts.total}
        critical={counts.critical}
        warning={counts.warning}
        info={counts.info}
        score={lastScan.overall_score}
        lastScanId={lastScan.id}
      />
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          New Scan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your repo and we&apos;ll audit your app for security issues.
        </p>
      </div>

      <ScanWizard />
    </main>
  );
}
