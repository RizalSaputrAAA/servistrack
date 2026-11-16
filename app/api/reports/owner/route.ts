import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail } from "@/lib/auth";
import { parseRange, fetchAll, one, groupBy, dayWIB, wib, respond, type Report } from "@/lib/report";
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // exceljs butuh Node, bukan Edge

const METHOD: Record<string, string> = { cash: "Tunai", qris: "QRIS", transfer: "Transfer" };

// GET /api/reports/owner?from=2026-11-01&to=2026-11-30&format=json|csv|xlsx
// Pendapatan servis = baris di tabel payments milik tiket toko ini.
export async function GET(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (me.role !== "owner") return json({ error: "Hanya pemilik toko" }, 403);

  try {
    const r = parseRange(new URL(req.url));
    const db = admin();
    const data = await fetchAll((a, b) =>
      db.from("payments")
        .select("id,method,amount,paid_at,tickets!inner(ticket_code,customer_name,device_brand,device_type,shop_id)")
        .eq("tickets.shop_id", me.shop_id)          // isolasi antar toko
        .gte("paid_at", r.fromISO).lt("paid_at", r.toISO)
        .order("paid_at", { ascending: true }).order("id")
        .range(a, b)
    );

    const rows = data.map((p: any) => {
      const t = one(p.tickets);
      return {
        paid_at: wib(p.paid_at),
        day: dayWIB(p.paid_at),
        ticket_code: t.ticket_code,
        customer: t.customer_name,
        device: [t.device_brand, t.device_type].filter(Boolean).join(" "),
        method: METHOD[p.method] || p.method,
        amount: p.amount as number,
      };
    });
    const total = rows.reduce((a, x) => a + x.amount, 0);

    const rep: Report = {
      range: { from: r.from, to: r.to },
      cards: [
        { label: "Total pendapatan servis", value: total, kind: "money" },
        { label: "Jumlah transaksi", value: rows.length, kind: "number" },
        { label: "Rata-rata per transaksi", value: rows.length ? Math.round(total / rows.length) : 0, kind: "money" },
      ],
      groups: [
        { title: "Per metode bayar", items: groupBy(rows, (x) => x.method, (x) => x.amount).sort((a, b) => b.total - a.total) },
        { title: "Per hari", items: groupBy(rows, (x) => x.day, (x) => x.amount).sort((a, b) => a.label.localeCompare(b.label)) },
      ],
      columns: [
        { key: "paid_at", label: "Waktu bayar (WIB)", width: 20 },
        { key: "ticket_code", label: "Kode tiket", width: 16 },
        { key: "customer", label: "Pelanggan", width: 24 },
        { key: "device", label: "Perangkat", width: 22 },
        { key: "method", label: "Metode", width: 12 },
        { key: "amount", label: "Jumlah (Rp)", money: true },
      ],
      rows,
    };
    return respond(req, rep, "laporan-servis", "Laporan Pendapatan Servis");
  } catch (e) { return fail(e); }
}
