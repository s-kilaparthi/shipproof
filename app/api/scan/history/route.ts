import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createServerClient();
  const auth = await requireUser(supabase);

  if ("error" in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const repoName = searchParams.get("repo_name");

  if (!repoName) {
    return Response.json({ error: "repo_name is required" }, { status: 400 });
  }

  const { data: scan } = await supabase
    .from("scans")
    .select("id, created_at, overall_score")
    .eq("user_id", auth.user.id)
    .eq("repo_name", repoName)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scan) {
    return Response.json({ hasPreviousScan: false });
  }

  const { count } = await supabase
    .from("scan_results")
    .select("*", { count: "exact", head: true })
    .eq("scan_id", scan.id);

  return Response.json({
    hasPreviousScan: true,
    scanId: scan.id,
    createdAt: scan.created_at,
    issueCount: count ?? 0,
    overallScore: scan.overall_score,
  });
}
