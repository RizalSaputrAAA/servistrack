import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail } from "@/lib/auth";
import { getSubState, isDemoShop } from "@/lib/subscription";
import { PRICE_MONTHLY, PRICE_YEARLY, PAY_METHODS } from "@/lib/plans";
import { createSnapTransaction, midtransConfig } from "@/lib/midtrans";
export const dynamic = "force-dynamic";

function originOf(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return host ? `${proto}://${host}` : "";
}

export async function GET(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  try {
    const state = await getSubState(me.shop_id);
    const { data: hist } = await admin().from("sub_invoices").select("*").eq("shop_id", me.shop_id).order("created_at", { ascending: false }).limit(10);
    const pending = (hist || []).find((h: any) => h.status === "pending") || null;
    const cfg = midtransConfig();
    return json({
      state, pending, history: hist || [],
      demo: isDemoShop(me.shop_id),
      gateway: { enabled: cfg.enabled, production: cfg.production },
    });
  } catch (e) { return fail(e, 500); }
}

// Kode unik 1-999 untuk membedakan nominal antar tagihan.
// Aturan: tidak boleh sama dengan kode yang PERNAH dipakai toko ini,
// dan tidak bentrok dengan tagihan pending toko lain (agar admin mudah mencocokkan).
async function pickUniqueCode(db: any, shopId: string) {
  const { data: mine } = await db.from("sub_invoices")
    .select("unique_code").eq("shop_id", shopId)
    .order("created_at", { ascending: false }).limit(500);
  const used = new Set<number>((mine || []).map((r: any) => Number(r.unique_code)).filter((n: number) => !isNaN(n)));

  const { data: pending } = await db.from("sub_invoices")
    .select("unique_code,shop_id").eq("status", "pending").eq("claimed", false);
  const usedGlobal = new Set<number>((pending || [])
    .filter((r: any) => r.shop_id !== shopId)
    .map((r: any) => Number(r.unique_code))
    .filter((n: number) => !isNaN(n)));

  const free: number[] = [];
  for (let i = 1; i <= 999; i++) if (!used.has(i) && !usedGlobal.has(i)) free.push(i);
  if (free.length > 0) return free[Math.floor(Math.random() * free.length)];

  // Semua angka sudah terpakai: lanjutkan dari angka terbesar agar tetap berbeda.
  const max = used.size ? Math.max(...Array.from(used)) : 0;
  return (max % 999) + 1;
}

export async function POST(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (me.role !== "owner") return json({ error: "Hanya pemilik toko yang dapat mengelola langganan" }, 403);
  const b = await req.json().catch(() => ({}));
  const db = admin();

  // Bayar online lewat Midtrans (dipakai toko sungguhan, bukan toko demo).
  if (b.action === "checkout") {
    if (!["monthly", "yearly"].includes(b.plan)) return fail("Paket tidak valid");
    if (!midtransConfig().enabled) return fail("Pembayaran online belum aktif. Hubungi admin.");
    if (isDemoShop(me.shop_id)) return fail("Toko demo tidak perlu membayar");

    await db.from("sub_invoices").update({ status: "cancelled" })
      .eq("shop_id", me.shop_id).eq("status", "pending").eq("claimed", false);

    const amount = b.plan === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY;
    const { data: inv, error } = await db.from("sub_invoices").insert({
      shop_id: me.shop_id, plan: b.plan, amount, unique_code: 0, method: "midtrans",
    }).select().single();
    if (error || !inv) return fail(error || "Gagal membuat tagihan", 500);

    const { data: au } = await db.auth.admin.getUserById(me.id);
    try {
      const snap = await createSnapTransaction({
        orderId: inv.id,
        amount,
        itemName: `Langganan ${b.plan === "yearly" ? "Tahunan" : "Bulanan"} ServisTrack`,
        customer: { name: me.full_name, email: au?.user?.email, phone: null },
        finishUrl: `${originOf(req)}/langganan`,
      });
      return json({ ok: true, redirect_url: snap.redirect_url, invoice_id: inv.id });
    } catch (e: any) {
      await db.from("sub_invoices").delete().eq("id", inv.id);
      return fail(e?.message || "Gagal membuka pembayaran", 500);
    }
  }

  // Tagihan manual (QRIS statis / e-wallet) — tetap dipakai toko demo dan sebagai cadangan.
  if (b.action === "order") {
    if (!["monthly", "yearly"].includes(b.plan)) return fail("Paket tidak valid");
    if (!PAY_METHODS.some((m) => m.id === b.method)) return fail("Pilih metode pembayaran");
    await db.from("sub_invoices").update({ status: "cancelled" })
      .eq("shop_id", me.shop_id).eq("status", "pending").eq("claimed", false);
    const unique = await pickUniqueCode(db, me.shop_id); // kode unik per toko, tidak berulang
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
