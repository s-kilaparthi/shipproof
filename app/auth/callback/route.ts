import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ALLOWED_NEXT_PATHS = ["/dashboard", "/scan"];

function getRedirectOrigin(request: Request): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

function resolveNextPath(rawNext: string | null): string {
  const candidate = rawNext?.trim() || "/dashboard";

  const isAllowed = ALLOWED_NEXT_PATHS.some(
    (allowed) => candidate === allowed || candidate.startsWith(`${allowed}/`)
  );

  return isAllowed ? candidate : "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRedirectOrigin(request);
  const code = searchParams.get("code");
  // Allowlist validation for ?next= (defaults to /dashboard if invalid or absent).
  resolveNextPath(searchParams.get("next"));

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
