import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail, loadTicket } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (!["technician", "owner"].includes(me.role)) return json({ error: "Hanya teknisi" }, 403);
  const b = await req.json().catch(() => ({}));
  const qty = Math.floor(Number(b.qty));
  if (!b.part_id || !qty || qty < 1) return fail("Pilih part dan isi jumlah minimal 1");

  const ticket = await loadTicket(params.id, me.shop_id);
  if (!ticket) return json({ error: "Tiket tidak ditemukan" }, 404);
  if (ticket.status !== "in_progress") return fail("Part hanya bisa dicatat saat status Dikerjakan");

  const db = admin();
  const { data: part } = await db.from("parts").select("*").eq("id", b.part_id).eq("shop_id", me.shop_id).single();
  if (!part) return fail("Part tidak ditemukan", 404);
  if (part.stock < qty) return fail(`Stok ${part.name} tidak cukup (sisa ${part.stock})`);

  // optimistic lock: hanya update jika stok belum berubah
  const { data: upd } = await db.from("parts").update({ stock: part.stock - qty })
    .eq("id", part.id).eq("stock", part.stock).select();
  if (!upd || upd.length === 0) return fail("Stok baru saja berubah, coba lagi");

  const { error } = await db.from("part_usage").insert({
    ticket_id: ticket.id, part_id: part.id, qty, price_at_use: part.price_sell,
  });
  if (error) return fail(error, 500);
  return json({ ok: true, stock_left: part.stock - qty });
}
