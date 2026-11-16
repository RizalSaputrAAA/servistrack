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
  const t = triage(symptoms);

  // Kode tiket dipakai untuk pelacakan publik, jadi harus unik GLOBAL (lintas toko).
  // Setiap percobaan membaca ulang nomor terbesar, sehingga saat banyak toko membuat
  // tiket bersamaan, nomor ikut bergeser dan tidak gagal karena bentrok.
  let data: any = null;
  let code = "";
  let lastErr: any = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data: last } = await db.from("tickets").select("ticket_code")
      .like("ticket_code", `SV-${year}-%`)
      .order("ticket_code", { ascending: false }).limit(1);
    const lastSeq = last?.[0]?.ticket_code ? parseInt(String(last[0].ticket_code).split("-")[2], 10) : 0;
    const seq = (Number.isNaN(lastSeq) ? 0 : lastSeq) + 1;
    code = `SV-${year}-${String(seq).padStart(4, "0")}`;

    const res = await db.from("tickets").insert({
      shop_id: me.shop_id, ticket_code: code,
      customer_name: name, customer_phone: phone,
      device_brand: b.brand || null, device_type: b.type || null,
      symptoms, notes: b.notes || null,
      triage_diagnosis: t.diagnosis, triage_confidence: t.confidence, triage_score: t.score,
      status: "received", created_by: me.id,
    }).select().single();

    if (!res.error) { data = res.data; lastErr = null; break; }
    lastErr = res.error;
    if (!/duplicate key/i.test(res.error.message)) break;
    await new Promise((r) => setTimeout(r, 15 + attempt * 10)); // beri jeda singkat sebelum membaca ulang
  }
  if (!data) return fail(lastErr || "Gagal membuat tiket", 500);

  await db.from("ticket_events").insert({
    ticket_id: data.id, from_status: null, to_status: "received",
    note: "Laptop diterima di toko", is_public: true, actor_id: me.id,
  });
  return json({ id: data.id, ticket_code: code });
}
