import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return null;
  return email;
}

function normalizePlan(value: unknown): string | null {
  if (value === "launch") return "launch";
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    if (!email) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }

    const plan = normalizePlan(body?.plan);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { error: "Waitlist is not configured on this environment" },
        { status: 503 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: existing } = await supabase
      .from("waitlist")
      .select("id, plan")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      const nextPlan =
        plan === "launch" || existing.plan === "launch" ? "launch" : null;

      const { error } = await supabase
        .from("waitlist")
        .update({ plan: nextPlan })
        .eq("email", email);

      if (error) {
        return Response.json({ error: "Failed to update waitlist" }, { status: 500 });
      }

      return Response.json({ ok: true, updated: true });
    }

    const { error } = await supabase.from("waitlist").insert({ email, plan });

    if (error) {
      return Response.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return Response.json({ ok: true, updated: false });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
