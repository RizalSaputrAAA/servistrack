import { admin } from "@/lib/supabase-admin";
import { getStaff, json, fail } from "@/lib/auth";
import { limited } from "@/lib/ratelimit";
export const dynamic = "force-dynamic";

const ROLES = ["cashier", "technician", "owner"];

async function requireOwner(req: Request) {
  const me = await getStaff(req);
  if (!me) return { err: json({ error: "Belum login" }, 401) };
  if (me.role !== "owner") return { err: json({ error: "Hanya pemilik toko yang boleh mengelola staf" }, 403) };
  return { me };
}

export async function GET(req: Request) {
  const { me, err } = await requireOwner(req);
  if (err) return err;
  const db = admin();
  const { data: profiles } = await db.from("profiles")
    .select("id,full_name,role,active,created_at,whatsapp").eq("shop_id", me!.shop_id).order("created_at");
  const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailById: Record<string, string> = {};
  for (const u of users?.users || []) if (u.id) emailById[u.id] = u.email || "";
  return json({ staff: (profiles || []).map((p: any) => ({ ...p, email: emailById[p.id] || "" })) });
}

export async function POST(req: Request) {
  if (limited(req, 20)) return json({ error: "Terlalu banyak percobaan, tunggu 1 menit" }, 429);
  const { me, err } = await requireOwner(req);
  if (err) return err;
  const db = admin();
  const b = await req.json().catch(() => ({}));

  try {
    if (b.action === "add") {
      const fullName = String(b.full_name || "").trim();
      const email = String(b.email || "").trim().toLowerCase();
      const role = String(b.role || "cashier");
      const password = String(b.password || "");
      const whatsapp = String(b.whatsapp || "").trim();
      if (fullName.length < 3) return fail("Nama staf minimal 3 karakter");
      if (whatsapp && !/^08\d{8,12}$/.test(whatsapp)) return fail("Nomor WhatsApp staf harus format 08xx (10-14 digit)");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Email tidak valid");
      if (!ROLES.includes(role)) return fail("Peran tidak valid");
      if (password.length < 8) return fail("Password minimal 8 karakter");

      const { data: cu, error: cuErr } = await db.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName },
      });
      if (cuErr || !cu?.user) {
        const m = cuErr?.message || "";
        return fail(/already|registered|exists|duplicate/i.test(m) ? "Email sudah terdaftar" : (m || "Gagal membuat akun"));
      }
      const { error: prErr } = await db.from("profiles")
        .insert({ id: cu.user.id, shop_id: me!.shop_id, full_name: fullName, role, whatsapp: whatsapp || null });
      if (prErr) {
        await db.auth.admin.deleteUser(cu.user.id).catch(() => {});
        return fail(prErr.message);
      }
      return json({ ok: true });
    }

    // Semua aksi lain harus menyasar staf di toko yang sama.
    const id = String(b.id || "");
    const { data: target } = await db.from("profiles").select("id,shop_id,role").eq("id", id).single();
    if (!target || target.shop_id !== me!.shop_id) return fail("Staf tidak ditemukan di toko Anda");

    if (b.action === "set_active") {
      if (target.id === me!.id) return fail("Tidak bisa menonaktifkan akun sendiri");
      const { error } = await db.from("profiles").update({ active: !!b.active }).eq("id", id);
      if (error) return fail(error);
      return json({ ok: true });
    }

    if (b.action === "set_whatsapp") {
      const wa = String(b.whatsapp || "").trim();
      if (wa && !/^08\d{8,12}$/.test(wa)) return fail("Nomor WhatsApp harus format 08xx (10-14 digit)");
      const { error } = await db.from("profiles").update({ whatsapp: wa || null }).eq("id", id);
      if (error) return fail(error);
      return json({ ok: true });
    }

    if (b.action === "reset_password") {
      const password = String(b.password || "");
      if (password.length < 8) return fail("Password minimal 8 karakter");
      const { error } = await db.auth.admin.updateUserById(id, { password });
      if (error) return fail(error);
      return json({ ok: true });
    }

    return fail("Aksi tidak dikenal");
  } catch (e) { return fail(e, 500); }
}
