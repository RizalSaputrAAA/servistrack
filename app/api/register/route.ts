import { admin } from "@/lib/supabase-admin";
import { json, fail } from "@/lib/auth";
import { limited } from "@/lib/ratelimit";
import { seedPartRows } from "@/lib/seed-parts";
export const dynamic = "force-dynamic";

// Pendaftaran toko baru: buat akun pemilik + toko + profil + suku cadang awal.
// Set REGISTRATION_OPEN=false di environment untuk menutup pendaftaran.
export async function POST(req: Request) {
  if (process.env.REGISTRATION_OPEN === "false") return json({ error: "Pendaftaran sedang ditutup" }, 403);
  if (limited(req, 5)) return json({ error: "Terlalu banyak percobaan. Tunggu 1 menit." }, 429);

  const b = await req.json().catch(() => ({}));
  const shopName = String(b.shop_name || "").trim();
  const ownerName = String(b.owner_name || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const phone = String(b.phone || "").trim();
  const address = String(b.address || "").trim();

  if (shopName.length < 3) return fail("Nama toko minimal 3 karakter");
  if (ownerName.length < 3) return fail("Nama pemilik minimal 3 karakter");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Email tidak valid");
  if (!/^08\d{8,12}$/.test(phone)) return fail("Nomor WhatsApp toko wajib diisi, format 08xx (10-14 digit)");
  if (password.length < 8) return fail("Password minimal 8 karakter");

  const db = admin();

  // 1) Akun pemilik. email_confirm: true agar bisa langsung masuk.
  const { data: created, error: uErr } = await db.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: ownerName },
  });
  if (uErr || !created?.user) {
    const m = uErr?.message || "";
    const msg = /already|registered|exists|duplicate/i.test(m) ? "Email sudah terdaftar" : (m || "Gagal membuat akun");
    return fail(msg);
  }
  const userId = created.user.id;

  // 2) Toko baru. Masa percobaan mengikuti default kolom trial_ends_at.
  const { data: shop, error: sErr } = await db.from("shops")
    .insert({ name: shopName, address: address || null, phone: phone || null })
    .select("id").single();
  if (sErr || !shop) {
    await db.auth.admin.deleteUser(userId).catch(() => {});
    return fail(sErr?.message || "Gagal membuat toko");
  }

  // 3) Profil pemilik.
  const { error: pErr } = await db.from("profiles")
    .insert({ id: userId, shop_id: shop.id, full_name: ownerName, role: "owner" });
  if (pErr) {
    await db.from("shops").delete().eq("id", shop.id);
    await db.auth.admin.deleteUser(userId).catch(() => {});
    return fail(pErr.message);
  }

  // 4) Suku cadang awal supaya toko baru langsung bisa dipakai.
  await db.from("parts").insert(seedPartRows(shop.id));

  return json({ ok: true, shop_id: shop.id });
}
