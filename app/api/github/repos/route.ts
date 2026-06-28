import { createServerClient } from "@/lib/supabase/server";
import { createOctokit } from "@/lib/github";
import { getGitHubToken, requireUser } from "@/lib/auth";
import type { GitHubRepo } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerClient();
    const auth = await requireUser(supabase);

    if ("error" in auth) {
      return auth.error;
    }

    const token = await getGitHubToken(supabase);

    if (!token) {
      return Response.json(
        {
          error:
            "GitHub token not found. Please sign out and sign in again with GitHub.",
        },
        { status: 401 }
      );
    }

    const octokit = createOctokit(token);
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    const repos: GitHubRepo[] = data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      private: repo.private ?? false,
      description: repo.description,
      updated_at: repo.updated_at ?? new Date().toISOString(),
    }));

    return Response.json({ repos });
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error);
    return Response.json(
      { error: "Failed to fetch repositories from GitHub." },
      { status: 500 }
    );
  }
}
