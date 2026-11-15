import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail, loadTicket, changeStatus } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (!["cashier", "owner"].includes(me.role)) return json({ error: "Tidak punya akses" }, 403);
  const b = await req.json().catch(() => ({}));
  const amount = Number(b.amount);
  if (!["cash", "qris", "transfer"].includes(b.method)) return fail("Metode pembayaran tidak valid");
  if (!amount || amount <= 0) return fail("Jumlah dibayar harus lebih dari 0");
  const ticket = await loadTicket(params.id, me.shop_id);
  if (!ticket) return json({ error: "Tiket tidak ditemukan" }, 404);
  if (ticket.status !== "done") return fail("Pembayaran hanya bisa dicatat saat status Selesai");

  const db = admin();
  const { error } = await db.from("payments").insert({
    ticket_id: ticket.id, method: b.method, amount, note: b.note || null, created_by: me.id,
  });
  if (error) return fail(error, 500);
  await db.from("tickets").update({ final_cost: amount }).eq("id", ticket.id);
  try {
    await changeStatus(ticket, "picked_up", me.id, "Pembayaran lunas, laptop diambil", true);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
