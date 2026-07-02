import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("scans").select("id").limit(1);
    if (error) {
      return Response.json(
        { status: "degraded", db: error.message },
        { status: 503 }
      );
    }
    return Response.json({
      status: "ok",
      db: "connected",
      ts: new Date().toISOString(),
    });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
