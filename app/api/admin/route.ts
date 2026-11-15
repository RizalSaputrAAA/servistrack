import { timingSafeEqual } from "crypto";
import { admin } from "@/lib/supabase-admin";
import { json, fail } from "@/lib/auth";
import { extendSub, getSubState } from "@/lib/subscription";
import { limited } from "@/lib/ratelimit";
import { TRIAL_DAYS } from "@/lib/plans";
export const dynamic = "force-dynamic";

function passwordOk(req: Request) {
  const pw = process.env.ADMIN_PASSWORD || "";
  const got = req.headers.get("x-admin-password") || "";
  if (!pw) return false;
  const a = Buffer.from(pw), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Jalur kedua: pemilik toko yang sudah login (Bearer token) boleh membuka admin.
// Sengaja tidak memakai getStaff() agar gerbang langganan tidak ikut memblokir admin.
async function ownerByToken(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const db = admin();
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return false;
  const { data: p } = await db.from("profiles").select("role,active").eq("id", data.user.id).single();
  return !!p && p.active && p.role === "owner";
}

async function allowed(req: Request) {
  return passwordOk(req) || ownerByToken(req);
}

export async function GET(req: Request) {
  if (limited(req, 20)) return json({ error: "Terlalu banyak percobaan, tunggu 1 menit" }, 429);
  if (!(await allowed(req))) return json({ error: "Password admin salah atau belum login sebagai pemilik toko" }, 401);
  try {
    const db = admin();
    const { data: shops } = await db.from("shops").select("id,name").order("created_at");
    const list = [];
    for (const s of shops || []) list.push({ ...s, state: await getSubState(s.id) });
    const { data: invoices } = await db.from("sub_invoices").select("*, shops(name)").eq("status", "pending")
      .order("claimed", { ascending: false }).order("created_at");
    return json({ shops: list, invoices: invoices || [] });
  } catch (e) { return fail(e, 500); }
}

export async function POST(req: Request) {
  if (limited(req, 20)) return json({ error: "Terlalu banyak percobaan, tunggu 1 menit" }, 429);
  if (!(await allowed(req))) return json({ error: "Password admin salah atau belum login sebagai pemilik toko" }, 401);
  const b = await req.json().catch(() => ({}));
  const db = admin();
  try {
    if (b.action === "approve" || b.action === "reject") {
      const { data: inv } = await db.from("sub_invoices").select("*").eq("id", b.id).eq("status", "pending").single();
      if (!inv) return fail("Tagihan tidak ditemukan atau sudah diproses");
      if (b.action === "approve") {
        await extendSub(inv.shop_id, inv.plan);
        await db.from("sub_invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv.id);
      } else {
        await db.from("sub_invoices").update({ status: "rejected" }).eq("id", inv.id);
      }
    } else if (b.action === "manual") {
      if (!["monthly", "yearly"].includes(b.plan)) return fail("Paket tidak valid");
      await extendSub(b.shop_id, b.plan);
    } else if (b.action === "reset_user_password") {
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      if (!email) return fail("Email wajib diisi");
      if (password.length < 8) return fail("Password minimal 8 karakter");
      const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
      const u = (list?.users || []).find((x: any) => (x.email || "").toLowerCase() === email);
      if (!u) return fail("Email tidak ditemukan");
      const { error: pwErr } = await db.auth.admin.updateUserById(u.id, { password });
      if (pwErr) return fail(pwErr);
    } else if (b.action === "reset_trial") {
      const until = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();
      await db.from("shops").update({ plan: "trial", trial_ends_at: until, paid_until: null }).eq("id", b.shop_id);
    } else return fail("Aksi tidak dikenal");
    return json({ ok: true });
  } catch (e) { return fail(e, 500); }
}
