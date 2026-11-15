import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail } from "@/lib/auth";
export const dynamic = "force-dynamic";

// Pengaturan toko: nama, alamat, dan nomor WhatsApp toko.
// Nomor ini dipakai pelanggan untuk menghubungi toko saat melacak tiket.
export async function GET(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  const { data: shop } = await admin().from("shops").select("id,name,address,phone").eq("id", me.shop_id).single();
  return json({ shop });
}

export async function PATCH(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  if (me.role !== "owner") return json({ error: "Hanya pemilik toko yang boleh mengubah data toko" }, 403);

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const address = String(b.address || "").trim();

  if (name.length < 3) return fail("Nama toko minimal 3 karakter");
  if (!/^08\d{8,12}$/.test(phone)) return fail("Nomor WhatsApp harus format 08xx (10-14 digit)");

  const { error } = await admin().from("shops")
    .update({ name, phone, address: address || null }).eq("id", me.shop_id);
  if (error) return fail(error, 500);
  return json({ ok: true });
}
