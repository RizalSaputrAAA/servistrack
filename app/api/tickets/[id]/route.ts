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
