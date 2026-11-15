import { admin } from "@/lib/supabase-admin";
import { extendSub } from "@/lib/subscription";
import { verifySignature } from "@/lib/midtrans";
export const dynamic = "force-dynamic";

// Webhook Midtrans: dipanggil otomatis saat status pembayaran berubah.
// order_id = id tagihan (sub_invoices.id), jadi tidak perlu kolom tambahan.
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));

  if (!verifySignature(b)) {
    return new Response("signature tidak valid", { status: 401 });
  }

  const db = admin();
  const { data: inv } = await db.from("sub_invoices").select("*").eq("id", String(b.order_id || "")).single();
  if (!inv) return new Response("ok", { status: 200 }); // tetap 200 agar Midtrans tidak mengulang terus

  const st = String(b.transaction_status || "");
  const fraud = String(b.fraud_status || "");
  const lunas = st === "settlement" || (st === "capture" && (!fraud || fraud === "accept"));

  if (lunas) {
    if (inv.status !== "paid") {
      await extendSub(inv.shop_id, inv.plan);
      await db.from("sub_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString(), method: inv.method || "midtrans" })
        .eq("id", inv.id);
    }
  } else if (["deny", "failure"].includes(st)) {
    await db.from("sub_invoices").update({ status: "rejected" }).eq("id", inv.id).eq("status", "pending");
  } else if (["cancel", "expire"].includes(st)) {
    await db.from("sub_invoices").update({ status: "cancelled" }).eq("id", inv.id).eq("status", "pending");
  }

  return new Response("ok", { status: 200 });
}
