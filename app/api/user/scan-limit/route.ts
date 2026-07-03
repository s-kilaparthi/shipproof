import { requireUser } from "@/lib/auth";
import { getScanLimitStatus } from "@/lib/scan/scan-limit";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerClient();
    const auth = await requireUser(supabase);

    if ("error" in auth) {
      return auth.error;
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("plan, total_scans_used")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (error) {
      return Response.json(
        { error: "Failed to load scan limit", details: error.message },
        { status: 500 }
      );
    }

    const status = getScanLimitStatus(
      profile?.plan,
      profile?.total_scans_used
    );

    return Response.json(status);
  } catch (error) {
    return Response.json(
      {
        error: "Failed to load scan limit",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
