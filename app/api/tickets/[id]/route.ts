import { admin } from "@/lib/supabase-admin";
import { getStaff, json, loadTicket } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  const ticket = await loadTicket(params.id, me.shop_id);
  if (!ticket) return json({ error: "Tiket tidak ditemukan" }, 404);

  const db = admin();
  const [ev, us, pay, techs, parts] = await Promise.all([
    db.from("ticket_events").select("*").eq("ticket_id", ticket.id).order("created_at"),
    db.from("part_usage").select("id,qty,price_at_use,parts(name,code)").eq("ticket_id", ticket.id),
    db.from("payments").select("*").eq("ticket_id", ticket.id),
    db.from("profiles").select("id,full_name").eq("shop_id", me.shop_id).eq("role", "technician").eq("active", true),
    db.from("parts").select("id,code,name,stock").eq("shop_id", me.shop_id).order("name"),
  ]);
  return json({
    ticket, events: ev.data || [], usage: us.data || [], payments: pay.data || [],
    technicians: techs.data || [], parts: parts.data || [],
  });
}

// Hapus satu tiket. Data turunan (event, pembayaran, pemakaian part, foto)
// ikut terhapus lewat ON DELETE CASCADE di database.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (!["owner", "cashier"].includes(me.role)) {
    return json({ error: "Hanya pemilik toko atau kasir yang boleh menghapus tiket" }, 403);
  }
  const db = admin();
  const { data: t } = await db.from("tickets").select("id,ticket_code")
    .eq("id", params.id).eq("shop_id", me.shop_id).single();
  if (!t) return json({ error: "Tiket tidak ditemukan" }, 404);
  const { error } = await db.from("tickets").delete().eq("id", t.id).eq("shop_id", me.shop_id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, ticket_code: t.ticket_code });
}
