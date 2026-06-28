import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export function createServiceRoleClient() {
  return createSupabaseClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
