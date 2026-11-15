import { getStaff, json, fail, loadTicket, changeStatus } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  const { to } = await req.json().catch(() => ({}));
  const ticket = await loadTicket(params.id, me.shop_id);
  if (!ticket) return json({ error: "Tiket tidak ditemukan" }, 404);
  // klik ganda / permintaan ulang: status sudah sesuai, anggap berhasil
  if (ticket.status === to) return json({ ok: true });
  // waiting_approval & picked_up punya jalur khusus (penawaran / pembayaran)
  if (["waiting_approval", "picked_up", "cancelled"].includes(to))
    return fail("Status ini diubah lewat penawaran / pembayaran / pelanggan");
  try {
    await changeStatus(ticket, to, me.id, `Status diubah oleh ${me.full_name}`, true);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
