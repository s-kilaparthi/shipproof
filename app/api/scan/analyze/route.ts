import { createOctokit } from "@/lib/github";
import { getGitHubToken, requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { runFullScan } from "@/lib/scan/analyzer";
import { formatFilesAsMarkdown } from "@/lib/scan/code-cleaner";
import { parseDiscoveryResponse } from "@/lib/scan/discovery-parser";
import { parseFixPrompt } from "@/lib/scan/fix-parser";
import { generateFingerprint } from "@/lib/scan/fingerprint";
import { fetchTargetedFiles } from "@/lib/scan/github-files";
import { calculateHealthScores } from "@/lib/scan/health-score";
import type { Tool } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  console.log("[scan/analyze] POST request received");

  let scanId: string | undefined;

  try {
    const supabase = createServerClient();
    const auth = await requireUser(supabase);

    if ("error" in auth) {
      return auth.error;
    }

    const body = (await request.json()) as {
      scan_id?: string;
      use_cached_discovery?: boolean;
      cached_discovery_response?: string;
      cached_discovery_at?: string;
    };
    scanId = body.scan_id;

    if (!scanId) {
      return Response.json({ error: "scan_id is required" }, { status: 400 });
    }

    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .eq("user_id", auth.user.id)
      .single();

    if (scanError || !scan) {
      return Response.json({ error: "Scan not found" }, { status: 404 });
    }

    const useCachedDiscovery = body.use_cached_discovery === true;
    const discoveryResponse = useCachedDiscovery
      ? (body.cached_discovery_response ?? scan.discovery_response ?? "")
      : (scan.discovery_response ?? "");

    if (useCachedDiscovery) {
      const cachedDate = body.cached_discovery_at ?? scan.created_at;
      console.log(
        `[scan/analyze] Using cached discovery from ${new Date(cachedDate).toISOString()}`
      );

      await supabase
        .from("scans")
        .update({ discovery_response: discoveryResponse })
        .eq("id", scan.id);
    }

    await supabase.from("scans").update({ status: "scanning" }).eq("id", scan.id);

    const githubToken = await getGitHubToken(supabase);
    if (!githubToken) {
      await supabase.from("scans").update({ status: "failed" }).eq("id", scan.id);
      return Response.json(
        { error: "GitHub token not found. Please sign in again." },
        { status: 401 }
      );
    }

    const parsed = parseDiscoveryResponse(discoveryResponse);
    const tool = scan.tool_selected as Tool;

    const octokit = createOctokit(githubToken);
    const files = await fetchTargetedFiles(octokit, scan.repo_name, parsed, 8);

    console.log(`[scan/analyze] Fetched ${files.length} targeted files`);

    const codeMarkdown =
      files.length > 0
        ? formatFilesAsMarkdown(files)
        : "No code files could be fetched from the repository.";

    const { issues } = await runFullScan({
      discoveryResponse,
      codeMarkdown,
      files,
      tool,
      domain: scan.domain,
    });

    const pillarScores = calculateHealthScores(issues);
    const discoveryCachedAt = useCachedDiscovery
      ? (body.cached_discovery_at ?? scan.created_at)
      : new Date().toISOString();

    await supabase.from("scan_results").delete().eq("scan_id", scan.id);

    if (issues.length > 0) {
      const rows = issues.map((issue) => {
        const { isMultiStep, steps } = parseFixPrompt(issue.fix_prompt);
        const fixType =
          issue.fix_type ??
          (isMultiStep && steps[0]?.fixType ? steps[0].fixType : "cursor");

        return {
          scan_id: scan.id,
          severity: issue.severity,
          pillar: issue.pillar,
          issue_name: issue.issue_name,
          file_path: issue.file_path,
          line_number: issue.line_number,
          description: issue.description,
          fix_prompt: issue.fix_prompt,
          fix_type: fixType,
          is_multi_step: isMultiStep,
          fix_steps: isMultiStep ? steps : null,
          confidence: issue.confidence ?? "medium",
          evidence: issue.evidence ?? null,
          fingerprint: generateFingerprint({
            pillar: issue.pillar,
            issue_name: issue.issue_name,
            file_path: issue.file_path,
          }),
        };
      });

      const { error: insertError } = await supabase
        .from("scan_results")
        .insert(rows);

      if (insertError) {
        console.error("[scan/analyze] Insert error:", insertError);
        await supabase.from("scans").update({ status: "failed" }).eq("id", scan.id);
        return Response.json(
          { error: "Failed to save scan results", details: insertError.message },
          { status: 500 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("scans")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        overall_score: pillarScores.overall,
        pillar_scores: pillarScores,
        discovery_cached_at: discoveryCachedAt,
        used_cached_discovery: useCachedDiscovery,
      })
      .eq("id", scan.id);

    if (updateError) {
      console.warn("[scan/analyze] Score columns may be missing:", updateError.message);
      await supabase
        .from("scans")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          discovery_cached_at: discoveryCachedAt,
          used_cached_discovery: useCachedDiscovery,
        })
        .eq("id", scan.id);
    }

    return Response.json({
      success: true,
      scan_id: scan.id,
      issues_count: issues.length,
      overall_score: pillarScores.overall,
      pillar_scores: pillarScores,
      used_cached_discovery: useCachedDiscovery,
    });
  } catch (error) {
    console.error("[scan/analyze] Unexpected error:", error);

    if (scanId) {
      try {
        const supabase = createServerClient();
        await supabase.from("scans").update({ status: "failed" }).eq("id", scanId);
      } catch {
        // ignore
      }
    }

    return Response.json(
      {
        error: "Analysis failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
