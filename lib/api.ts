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

// Header login (Bearer) + header tambahan, mis. { "x-admin-password": pw } untuk halaman admin.
export async function authHeaders(extra: Record<string, string> = {}) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

// Ambil JSON dari API laporan.
export async function getJson(path: string, extra: Record<string, string> = {}) {
  const res = await fetch(path, { cache: "no-store", headers: await authHeaders(extra) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Terjadi kesalahan");
  return j;
}

// Unduh file dari API yang butuh login (link <a> biasa tidak bisa mengirim header Authorization).
export async function download(path: string, filename: string, extra: Record<string, string> = {}) {
  const res = await fetch(path, { cache: "no-store", headers: await authHeaders(extra) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Gagal mengunduh file");
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
