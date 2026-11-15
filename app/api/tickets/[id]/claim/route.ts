import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail, loadTicket, changeStatus } from "@/lib/auth";
export const dynamic = "force-dynamic";

// Teknisi klaim tiket. Jika masih "received", otomatis mulai diagnosa.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (!["technician", "owner"].includes(me.role)) return json({ error: "Hanya teknisi" }, 403);
  const ticket = await loadTicket(params.id, me.shop_id);
  if (!ticket) return json({ error: "Tiket tidak ditemukan" }, 404);
  if (ticket.assigned_to && ticket.assigned_to !== me.id) return fail("Tiket sudah diklaim teknisi lain");
  const { error } = await admin().from("tickets").update({ assigned_to: me.id }).eq("id", ticket.id);
  if (error) return fail(error, 500);
  try {
    if (ticket.status === "received") await changeStatus(ticket, "diagnosing", me.id, `${me.full_name} mulai diagnosa`, true);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
