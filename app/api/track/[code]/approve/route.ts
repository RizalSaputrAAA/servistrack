import { admin } from "@/lib/supabase-admin";
import { json, fail, changeStatus } from "@/lib/auth";
import { limited } from "@/lib/ratelimit";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  if (limited(req)) return json({ error: "Terlalu banyak permintaan" }, 429);
  const code = decodeURIComponent(params.code).trim().toUpperCase();
  const db = admin();
  const { data: t } = await db.from("tickets").select("*").eq("ticket_code", code).single();
  if (!t) return json({ error: "Tiket tidak ditemukan" }, 404);
  if (t.status !== "waiting_approval") return fail("Tiket ini tidak sedang menunggu persetujuan");
  await db.from("tickets").update({ approved: true }).eq("id", t.id);
  try {
    await changeStatus({ ...t, approved: true }, "in_progress", null, "Pelanggan menyetujui penawaran", true);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
