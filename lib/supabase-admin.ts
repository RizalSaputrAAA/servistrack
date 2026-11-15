import { createClient } from "@supabase/supabase-js";

// HANYA dipakai di server (API routes). Jangan pernah import di komponen client.
export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
