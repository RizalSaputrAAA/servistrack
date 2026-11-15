import { admin } from "@/lib/supabase-admin";
import { json } from "@/lib/auth";
import { limited } from "@/lib/ratelimit";
export const dynamic = "force-dynamic";

const mask = (n: string) => {
  const p = (n || "").trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[1][0].toUpperCase()}.` : p[0];
};

export async function GET(req: Request, { params }: { params: { code: string } }) {
  if (limited(req)) return json({ error: "Terlalu banyak permintaan, coba lagi 1 menit" }, 429);
  const code = decodeURIComponent(params.code).trim().toUpperCase();
  const db = admin();
  const { data: t } = await db.from("tickets").select("*").eq("ticket_code", code).single();
  if (!t) return json({ error: "Kode tiket tidak ditemukan. Periksa kembali kode Anda." }, 404);

  const [{ data: events }, { data: shop }, { data: tech }] = await Promise.all([
    db.from("ticket_events").select("to_status,note,created_at").eq("ticket_id", t.id).eq("is_public", true).order("created_at"),
    db.from("shops").select("name,address,phone").eq("id", t.shop_id).single(),
    t.assigned_to
      ? db.from("profiles").select("full_name,whatsapp").eq("id", t.assigned_to).single()
      : Promise.resolve({ data: null } as any),
  ]);
  // Hanya field publik yang dikirim. Nomor HP & catatan internal TIDAK ikut.
  return json({
    ticket_code: t.ticket_code,
    customer_name: mask(t.customer_name),
    device: [t.device_brand, t.device_type].filter(Boolean).join(" "),
    created_at: t.created_at,
    status: t.status,
    diagnosis: t.triage_diagnosis,
    confidence: t.triage_confidence,
    estimated_cost: t.estimated_cost,
    public_note: t.public_note,
    approved: t.approved,
    events: events || [],
    shop,
    technician: tech ? { name: tech.full_name, whatsapp: tech.whatsapp || null } : null,
  });
}
