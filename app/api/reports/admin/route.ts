import { admin } from "@/lib/supabase-admin";
import { json, fail } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { isDemoShop } from "@/lib/subscription";
import { limited } from "@/lib/ratelimit";
import { PRICE_MONTHLY, PRICE_YEARLY } from "@/lib/plans";
import { parseRange, fetchAll, one, groupBy, wib, respond, type Report } from "@/lib/report";
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // exceljs butuh Node, bukan Edge

const PLAN: Record<string, string> = { monthly: "Bulanan", yearly: "Tahunan" };
const METHOD: Record<string, string> = { midtrans: "Midtrans", qris: "QRIS", dana: "DANA", shopeepay: "ShopeePay" };

// GET /api/reports/admin?from=...&to=...&format=json|csv|xlsx
// Pendapatan langganan = sub_invoices berstatus 'paid' (semua toko).
export async function GET(req: Request) {
  if (limited(req, 20)) return json({ error: "Terlalu banyak percobaan, tunggu 1 menit" }, 429);
  if (!(await isPlatformAdmin(req))) return json({ error: "Password admin salah, atau akun ini bukan pengelola platform" }, 401);

  try {
    const r = parseRange(new URL(req.url));
    const db = admin();
    const data = await fetchAll((a, b) =>
      db.from("sub_invoices")
        .select("id,plan,amount,unique_code,method,paid_at,shops(name)")
        .eq("status", "paid")
        .gte("paid_at", r.fromISO).lt("paid_at", r.toISO)
        .order("paid_at", { ascending: true }).order("id")
        .range(a, b)
    );

    const rows = data.map((p: any) => ({
      paid_at: wib(p.paid_at),
      month: wib(p.paid_at).slice(0, 7),
      shop: one(p.shops).name || "-",
      plan: PLAN[p.plan] || p.plan,
      method: METHOD[p.method] || p.method || "-",
      unique_code: p.unique_code || 0,
      amount: p.amount as number,
    }));
    const total = rows.reduce((a, x) => a + x.amount, 0);

    // Kondisi saat ini (tidak tergantung rentang tanggal): toko berbayar aktif & perkiraan MRR.
    // Toko demo dikecualikan karena tidak wajib bayar.
    const { data: shops, error } = await db.from("shops").select("id,plan,paid_until");
    if (error) throw new Error(error.message);
    const now = Date.now();
    const active = (shops || []).filter((s: any) =>
      !isDemoShop(s.id) && s.paid_until && new Date(s.paid_until).getTime() > now);
    const mrr = Math.round(active.reduce((a: number, s: any) =>
      a + (s.plan === "yearly" ? PRICE_YEARLY / 12 : PRICE_MONTHLY), 0));

    const rep: Report = {
      range: { from: r.from, to: r.to },
      cards: [
        { label: "Pendapatan langganan (periode)", value: total, kind: "money" },
        { label: "Jumlah tagihan lunas", value: rows.length, kind: "number" },
        { label: "Toko berlangganan aktif (saat ini)", value: active.length, kind: "number" },
        { label: "Perkiraan MRR (saat ini)", value: mrr, kind: "money" },
      ],
      groups: [
        { title: "Per paket", items: groupBy(rows, (x) => x.plan, (x) => x.amount).sort((a, b) => b.total - a.total) },
        { title: "Per metode bayar", items: groupBy(rows, (x) => x.method, (x) => x.amount).sort((a, b) => b.total - a.total) },
        { title: "Per bulan", items: groupBy(rows, (x) => x.month, (x) => x.amount).sort((a, b) => a.label.localeCompare(b.label)) },
      ],
      columns: [
        { key: "paid_at", label: "Waktu bayar (WIB)", width: 20 },
        { key: "shop", label: "Toko", width: 30 },
        { key: "plan", label: "Paket", width: 12 },
        { key: "method", label: "Metode", width: 14 },
        { key: "unique_code", label: "Kode unik", width: 11 },
        { key: "amount", label: "Jumlah (Rp)", money: true },
      ],
      rows,
    };
    return respond(req, rep, "laporan-langganan", "Laporan Pendapatan Langganan");
  } catch (e) { return fail(e, 500); }
}
