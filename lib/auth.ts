import { NextResponse } from "next/server";
import { admin } from "./supabase-admin";
import { NEXT } from "./status";
import { getSubState } from "./subscription";

export const json = (d: any, status = 200) => NextResponse.json(d, { status });
export const fail = (e: any, status = 400) => json({ error: e?.message || String(e) }, status);

// Ambil profil staf dari token Bearer. Null jika tidak valid / nonaktif.
export async function getStaff(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const db = admin();
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return null;
  const { data: p } = await db.from("profiles").select("*").eq("id", data.user.id).single();
  if (!p || !p.active) return null;
  // Gerbang langganan (aktif hanya jika SUB_ENFORCE=true). /api/me dan /api/subscription tetap terbuka.
  if (process.env.SUB_ENFORCE === "true") {
    const path = new URL(req.url).pathname;
    if (!path.startsWith("/api/me") && !path.startsWith("/api/subscription")) {
      try {
        const st = await getSubState(p.shop_id);
        if (!st.active) return null;
      } catch { /* data langganan belum siap: jangan kunci pengguna */ }
    }
  }
  return p;
}

export async function loadTicket(id: string, shopId: string) {
  const { data } = await admin().from("tickets").select("*").eq("id", id).eq("shop_id", shopId).single();
  return data;
}

// Satu-satunya pintu untuk mengubah status: validasi state machine + catat event.
export async function changeStatus(
  ticket: any, to: string, actorId: string | null, note: string, isPublic = true
) {
  const allowed = NEXT[ticket.status] || [];
  if (!allowed.includes(to)) throw new Error(`Transisi ${ticket.status} → ${to} tidak diizinkan`);
  const db = admin();
  if (ticket.status === "waiting_approval" && to === "in_progress" && !ticket.approved)
    throw new Error("Pelanggan belum menyetujui penawaran");
  if (to === "picked_up") {
    const { count } = await db.from("payments").select("id", { count: "exact", head: true }).eq("ticket_id", ticket.id);
    if (!count) throw new Error("Belum ada pembayaran untuk tiket ini");
  }
  const { error } = await db.from("tickets").update({ status: to, updated_at: new Date().toISOString() }).eq("id", ticket.id);
  if (error) throw new Error(error.message);
  await db.from("ticket_events").insert({
    ticket_id: ticket.id, from_status: ticket.status, to_status: to, note, is_public: isPublic, actor_id: actorId,
  });
}
