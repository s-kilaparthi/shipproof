import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const auth = await requireUser(supabase);
  if ("error" in auth) return auth.error;
  return Response.json({ message: "OK" }, { status: 200 });
}
