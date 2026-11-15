import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail } from "@/lib/auth";
import { triage, SYMPTOMS } from "@/lib/triage";
export const dynamic = "force-dynamic";

// GET /api/tickets?scope=mine|all&status=...
export async function GET(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  const status = url.searchParams.get("status");

  let q = admin()
    .from("tickets")
    .select("id,ticket_code,customer_name,customer_phone,device_brand,device_type,symptoms,triage_diagnosis,triage_score,status,assigned_to,created_at")
    .eq("shop_id", me.shop_id)
    .order("triage_score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);
  if (scope === "mine") q = q.eq("assigned_to", me.id);
  if (status === "all") {
    // tanpa filter status: tampilkan semua tiket
  } else if (status) {
    q = q.eq("status", status);
  } else {
    q = q.not("status", "in", "(picked_up,cancelled)");
  }

  const { data, error } = await q;
  if (error) return fail(error, 500);
  return json({ tickets: data });
}

// POST /api/tickets  -> buat tiket + jalankan triage
export async function POST(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (!["cashier", "owner"].includes(me.role)) return json({ error: "Tidak punya akses" }, 403);

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const valid = new Set(SYMPTOMS.map((s) => s.code));
  const symptoms: string[] = (b.symptoms || []).filter((s: string) => valid.has(s));

  if (!name) return fail("Nama pelanggan wajib diisi");
  if (!/^08\d{8,12}$/.test(phone)) return fail("Nomor HP harus format 08xx (10-14 digit)");
  if (symptoms.length === 0) return fail("Pilih minimal 1 gejala");

  const db = admin();
  const year = new Date().getFullYear();
  const { count } = await db.from("tickets").select("id", { count: "exact", head: true })
    .eq("shop_id", me.shop_id).like("ticket_code", `SV-${year}-%`);
  const code = `SV-${year}-${String((count || 0) + 1).padStart(4, "0")}`;
  const t = triage(symptoms);

  const { data, error } = await db.from("tickets").insert({
    shop_id: me.shop_id, ticket_code: code,
    customer_name: name, customer_phone: phone,
    device_brand: b.brand || null, device_type: b.type || null,
    symptoms, notes: b.notes || null,
    triage_diagnosis: t.diagnosis, triage_confidence: t.confidence, triage_score: t.score,
    status: "received", created_by: me.id,
  }).select().single();
  if (error) return fail(error, 500);

  await db.from("ticket_events").insert({
    ticket_id: data.id, from_status: null, to_status: "received",
    note: "Laptop diterima di toko", is_public: true, actor_id: me.id,
  });
  return json({ id: data.id, ticket_code: code });
}
