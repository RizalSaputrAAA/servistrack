import { timingSafeEqual } from "crypto";
import { admin } from "./supabase-admin";

// Aturan akses SAMA dengan app/api/admin/route.ts:
//  1) header x-admin-password = ADMIN_PASSWORD, atau
//  2) owner yang sudah login DAN emailnya ada di PLATFORM_ADMIN_EMAILS.
export async function isPlatformAdmin(req: Request) {
  const pw = process.env.ADMIN_PASSWORD || "";
  const got = req.headers.get("x-admin-password") || "";
  if (pw) {
    const a = Buffer.from(pw), b = Buffer.from(got);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  const emails = (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || emails.length === 0) return false;
  const db = admin();
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return false;
  const email = (data.user.email || "").toLowerCase();
  const { data: p } = await db.from("profiles").select("role,active").eq("id", data.user.id).single();
  return !!p && p.active && p.role === "owner" && emails.includes(email);
}
