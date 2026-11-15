import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail, loadTicket } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (!["cashier", "owner"].includes(me.role)) return json({ error: "Tidak punya akses" }, 403);
  const { technician_id } = await req.json().catch(() => ({}));
  const ticket = await loadTicket(params.id, me.shop_id);
  if (!ticket) return json({ error: "Tiket tidak ditemukan" }, 404);
  const { error } = await admin().from("tickets").update({ assigned_to: technician_id }).eq("id", ticket.id);
  if (error) return fail(error, 500);
  await admin().from("ticket_events").insert({
    ticket_id: ticket.id, from_status: ticket.status, to_status: ticket.status,
    note: "Teknisi ditugaskan", is_public: false, actor_id: me.id,
  });
  return json({ ok: true });
}
