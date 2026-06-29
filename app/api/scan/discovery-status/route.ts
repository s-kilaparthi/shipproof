import { requireUser } from "@/lib/auth";
import {
  formatDiscoveryAge,
  getDiscoveryAgeDays,
  getDiscoveryReferenceDate,
  requiresFreshDiscovery,
} from "@/lib/scan/discovery-cache";
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
    .select(
      "id, created_at, discovery_response, discovery_cached_at, tool_selected, overall_score"
    )
    .eq("user_id", auth.user.id)
    .eq("repo_name", repoName)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scan || !scan.discovery_response?.trim()) {
    return Response.json({
      hasDiscovery: false,
      discoveryAge: 0,
      requiresFreshDiscovery: true,
      lastScanId: null,
      lastScanDate: null,
      lastDiscoveryResponse: null,
      tool: null,
      overallScore: null,
      issueCount: 0,
    });
  }

  const referenceDate = getDiscoveryReferenceDate(scan);
  const discoveryAge = getDiscoveryAgeDays(referenceDate);
  const needsFresh = requiresFreshDiscovery(discoveryAge);

  const { count } = await supabase
    .from("scan_results")
    .select("*", { count: "exact", head: true })
    .eq("scan_id", scan.id);

  return Response.json({
    hasDiscovery: true,
    discoveryAge,
    discoveryAgeLabel: formatDiscoveryAge(referenceDate),
    requiresFreshDiscovery: needsFresh,
    lastScanId: scan.id,
    lastScanDate: scan.created_at,
    lastDiscoveryCachedAt:
      scan.discovery_cached_at ?? scan.created_at,
    lastDiscoveryResponse: scan.discovery_response,
    tool: scan.tool_selected,
    overallScore: scan.overall_score,
    issueCount: count ?? 0,
  });
}
