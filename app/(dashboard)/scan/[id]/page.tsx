import { redirect } from "next/navigation";

import { ScanReport } from "@/components/scan/scan-report";
import { createServerClient } from "@/lib/supabase/server";
import type { Tool } from "@/types";

interface ScanDetailPageProps {
  params: { id: string };
}

export default async function ScanDetailPage({ params }: ScanDetailPageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scan, error } = await supabase
    .from("scans")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !scan) {
    redirect("/dashboard");
  }

  const reportStatus: "scanning" | "completed" | "failed" =
    scan.status === "completed"
      ? "completed"
      : scan.status === "failed"
        ? "failed"
        : "scanning";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <ScanReport
        scanId={scan.id}
        repo={{
          id: 0,
          name: scan.repo_name.split("/").pop() ?? scan.repo_name,
          full_name: scan.repo_name,
          html_url: scan.repo_url,
          private: false,
          description: null,
          updated_at: scan.created_at,
        }}
        tool={scan.tool_selected as Tool}
        status={reportStatus}
      />
    </main>
  );
}
