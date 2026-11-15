import { timingSafeEqual } from "crypto";
import { admin } from "@/lib/supabase-admin";
import { json, fail } from "@/lib/auth";
import { extendSub, getSubState } from "@/lib/subscription";
import { limited } from "@/lib/ratelimit";
import { TRIAL_DAYS } from "@/lib/plans";
export const dynamic = "force-dynamic";

const ROLES = ["owner", "cashier", "technician"];

function passwordOk(req: Request) {
  const pw = process.env.ADMIN_PASSWORD || "";
  const got = req.headers.get("x-admin-password") || "";
  if (!pw) return false;
  const a = Buffer.from(pw), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Daftar email yang boleh masuk /admin lewat login owner (pengelola platform).
// Pisahkan dengan koma bila lebih dari satu. Default: akun demo owner.
function platformAdmins() {
  return (process.env.PLATFORM_ADMIN_EMAILS || "owner@servistrack.id")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Jalur kedua: pengelola platform yang sudah login (Bearer token).
// Sengaja tidak memakai getStaff() agar gerbang langganan tidak ikut memblokir admin.
async function ownerByToken(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const db = admin();
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return false;
  const email = (data.user.email || "").toLowerCase();
  const { data: p } = await db.from("profiles").select("role,active").eq("id", data.user.id).single();
  return !!p && p.active && p.role === "owner" && platformAdmins().includes(email);
}

async function allowed(req: Request) {
  return passwordOk(req) || ownerByToken(req);
}

export async function GET(req: Request) {
  if (limited(req, 20)) return json({ error: "Terlalu banyak percobaan, tunggu 1 menit" }, 429);
  if (!(await allowed(req))) return json({ error: "Password admin salah, atau akun ini bukan pengelola platform" }, 401);
  try {
    const db = admin();
    const { data: shops } = await db.from("shops").select("id,name").order("created_at");
    const list = [];
    for (const s of shops || []) list.push({ ...s, state: await getSubState(s.id) });
    const { data: invoices } = await db.from("sub_invoices").select("*, shops(name)").eq("status", "pending")
      .order("claimed", { ascending: false }).order("created_at");

    // Daftar staf + email (email ada di auth.users, bukan di tabel profiles).
    const { data: profiles } = await db.from("profiles")
      .select("id,shop_id,full_name,role,active").order("created_at");
    const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById: Record<string, string> = {};
    for (const u of users?.users || []) if (u.id) emailById[u.id] = u.email || "";
    const staff = (profiles || []).map((p: any) => ({ ...p, email: emailById[p.id] || "" }));

    return json({ shops: list, invoices: invoices || [], staff });
  } catch (e) { return fail(e, 500); }
}

export async function POST(req: Request) {
  if (limited(req, 20)) return json({ error: "Terlalu banyak percobaan, tunggu 1 menit" }, 429);
  if (!(await allowed(req))) return json({ error: "Password admin salah, atau akun ini bukan pengelola platform" }, 401);
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
    } else if (b.action === "add_staff") {
      const shopId = String(b.shop_id || "");
      const email = String(b.email || "").trim().toLowerCase();
      const fullName = String(b.full_name || "").trim();
      const role = String(b.role || "cashier");
      const password = String(b.password || "");
      if (!shopId) return fail("Pilih toko");
      if (fullName.length < 3) return fail("Nama staf minimal 3 karakter");
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
        .insert({ id: cu.user.id, shop_id: shopId, full_name: fullName, role });
      if (prErr) {
        await db.auth.admin.deleteUser(cu.user.id).catch(() => {});
        return fail(prErr.message);
      }
    } else if (b.action === "set_staff_active") {
      const { error: stErr } = await db.from("profiles").update({ active: !!b.active }).eq("id", b.id);
      if (stErr) return fail(stErr);
    } else if (b.action === "reset_trial") {
      const until = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();
      await db.from("shops").update({ plan: "trial", trial_ends_at: until, paid_until: null }).eq("id", b.shop_id);
    } else return fail("Aksi tidak dikenal");
    return json({ ok: true });
  } catch (e) { return fail(e, 500); }
}
