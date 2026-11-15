"use client";
import { getSupabase } from "./supabase-browser";

// Fetch ke API internal + otomatis kirim token login.
export async function api(path: string, opts: { method?: string; body?: any } = {}) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(path, {
    method: opts.method || "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Terjadi kesalahan");
  return json;
}
