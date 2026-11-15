import { createClient } from "@supabase/supabase-js";

// HANYA dipakai di server (API routes). Jangan pernah import di komponen client.
// fetch dengan cache: "no-store" penting agar perubahan status staf / langganan
// langsung berlaku. Tanpa ini Next.js menyimpan hasil GET dan data jadi basi.
const noStoreFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, cache: "no-store" });

export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, global: { fetch: noStoreFetch } }
  );
}
