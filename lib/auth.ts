import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";

export async function requireUser(
  supabase: SupabaseClient
): Promise<{ user: User } | { error: Response }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[auth] getUser error:", error.message);
  }

  if (error || !user) {
    return {
      error: new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: error?.message ?? "No authenticated user found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user };
}

export async function getGitHubToken(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.provider_token ?? null;
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      github_username:
        (user.user_metadata?.user_name as string | undefined) ??
        (user.user_metadata?.preferred_username as string | undefined) ??
        null,
    },
    { onConflict: "id" }
  );

  return { error };
}
