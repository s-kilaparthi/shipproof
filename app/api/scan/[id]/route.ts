import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const auth = await requireUser(supabase);

  if ("error" in auth) {
    return auth.error;
  }

  const scanId = params.id;

  const { data: scan, error: fetchError } = await supabase
    .from("scans")
    .select("id, user_id")
    .eq("id", scanId)
    .maybeSingle();

  if (fetchError) {
    return Response.json(
      { error: "Failed to look up scan", details: fetchError.message },
      { status: 500 }
    );
  }

  if (!scan) {
    return Response.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.user_id !== auth.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: resultsError } = await supabase
    .from("scan_results")
    .delete()
    .eq("scan_id", scanId);

  if (resultsError) {
    return Response.json(
      { error: "Failed to delete scan results", details: resultsError.message },
      { status: 500 }
    );
  }

  const { error: scanError } = await supabase
    .from("scans")
    .delete()
    .eq("id", scanId);

  if (scanError) {
    return Response.json(
      { error: "Failed to delete scan", details: scanError.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
