import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail, loadTicket, changeStatus } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  const b = await req.json().catch(() => ({}));
  const cost = Number(b.estimated_cost);
  if (!cost || cost <= 0) return fail("Estimasi biaya harus lebih dari 0");
  const ticket = await loadTicket(params.id, me.shop_id);
  if (!ticket) return json({ error: "Tiket tidak ditemukan" }, 404);
  if (ticket.status !== "diagnosing") return fail("Penawaran hanya bisa dibuat saat status Diagnosa");
  const { error } = await admin().from("tickets")
    .update({ estimated_cost: cost, public_note: b.public_note || null, approved: false })
    .eq("id", ticket.id);
  if (error) return fail(error, 500);
  try {
    await changeStatus(ticket, "waiting_approval", me.id, "Penawaran biaya dikirim ke pelanggan", true);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
