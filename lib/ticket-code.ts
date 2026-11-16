import type { SupabaseClient } from "@supabase/supabase-js";

// Awalan kode tiket per toko, mis. "Servis Laptop Mitra Pontianak" -> SLM.
// Bila dua toko berawalan sama, toko yang lebih dulu mendapat "BKG", berikutnya "BKG2".
export function basePrefix(name: string) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.slice(0, 4).map((w) => w[0].toUpperCase()).join("");
  }
  const w = words[0] || "TKT";
  return w.slice(0, 3).toUpperCase().padEnd(2, "X");
}

export async function shopPrefix(db: SupabaseClient, shopId: string) {
  const { data } = await db.from("shops").select("id,name,created_at").order("created_at");
  const shops = (data || []) as any[];
  const target = shops.find((s) => s.id === shopId);
  if (!target) return "TKT";
  const base = basePrefix(target.name);
  const sama = shops.filter((s) => basePrefix(s.name) === base);
  const idx = sama.findIndex((s) => s.id === shopId);
  return idx <= 0 ? base : `${base}${idx + 1}`;
}

export function ticketCode(prefix: string, year: number, seq: number) {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}
