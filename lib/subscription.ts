import { admin } from "./supabase-admin";

export type SubState = {
  active: boolean;
  type: "trial" | "paid" | "expired";
  plan: string | null;
  until: string | null;
  days: number;
};

// Status langganan sebuah toko: trial / berbayar / habis
export async function getSubState(shopId: string): Promise<SubState> {
  const { data: s, error } = await admin().from("shops").select("plan,trial_ends_at,paid_until").eq("id", shopId).single();
  if (error || !s) throw new Error("Data langganan belum siap. Jalankan supabase/04_subscription.sql di Supabase SQL Editor.");
  const now = Date.now();
  const paid = s.paid_until ? new Date(s.paid_until).getTime() : 0;
  const trial = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
  const days = (t: number) => Math.ceil((t - now) / 86400000);
  if (paid > now) return { active: true, type: "paid", plan: s.plan, until: s.paid_until, days: days(paid) };
  if (trial > now) return { active: true, type: "trial", plan: "trial", until: s.trial_ends_at, days: days(trial) };
  return { active: false, type: "expired", plan: s.plan, until: new Date(Math.max(paid, trial)).toISOString(), days: 0 };
}

// Perpanjang dari sisa masa aktif (kalau masih ada), bukan dari hari ini
export async function extendSub(shopId: string, plan: "monthly" | "yearly") {
  const db = admin();
  const { data: s } = await db.from("shops").select("paid_until").eq("id", shopId).single();
  const base = new Date(Math.max(Date.now(), s?.paid_until ? new Date(s.paid_until).getTime() : 0));
  if (plan === "yearly") base.setFullYear(base.getFullYear() + 1);
  else base.setMonth(base.getMonth() + 1);
  const { error } = await db.from("shops").update({ plan, paid_until: base.toISOString() }).eq("id", shopId);
  if (error) throw new Error(error.message);
}
