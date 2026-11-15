import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail } from "@/lib/auth";
import { getSubState } from "@/lib/subscription";
import { PRICE_MONTHLY, PRICE_YEARLY, PAY_METHODS } from "@/lib/plans";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  try {
    const state = await getSubState(me.shop_id);
    const { data: hist } = await admin().from("sub_invoices").select("*").eq("shop_id", me.shop_id).order("created_at", { ascending: false }).limit(10);
    const pending = (hist || []).find((h: any) => h.status === "pending") || null;
    return json({ state, pending, history: hist || [] });
  } catch (e) { return fail(e, 500); }
}

export async function POST(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (me.role !== "owner") return json({ error: "Hanya pemilik toko yang dapat mengelola langganan" }, 403);
  const b = await req.json().catch(() => ({}));
  const db = admin();

  if (b.action === "order") {
    if (!["monthly", "yearly"].includes(b.plan)) return fail("Paket tidak valid");
    if (!PAY_METHODS.some((m) => m.id === b.method)) return fail("Pilih metode pembayaran");
    await db.from("sub_invoices").update({ status: "cancelled" })
      .eq("shop_id", me.shop_id).eq("status", "pending").eq("claimed", false);
    const unique = Math.floor(Math.random() * 999) + 1; // kode unik agar pembayaran mudah dikenali
    const amount = (b.plan === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY) + unique;
    const { error } = await db.from("sub_invoices").insert({ shop_id: me.shop_id, plan: b.plan, amount, unique_code: unique, method: b.method });
    if (error) return fail(error, 500);
    return json({ ok: true });
  }

  if (b.action === "claim") {
    const note = String(b.note || "").trim();
    if (!note) return fail("Isi catatan pembayaran (nama pengirim / jam bayar)");
    const { error } = await db.from("sub_invoices").update({ claimed: true, claim_note: note })
      .eq("id", b.id).eq("shop_id", me.shop_id).eq("status", "pending");
    if (error) return fail(error, 500);
    return json({ ok: true });
  }
  return fail("Aksi tidak dikenal");
}
