import { getStaff, json } from "@/lib/auth";
import { getSubState } from "@/lib/subscription";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getStaff(req);
  if (!me) return json({ error: "Belum login" }, 401);
  const enforce = process.env.SUB_ENFORCE === "true";
  try {
    const sub = await getSubState(me.shop_id);
    return json({ ...me, sub: { ...sub, enforce, locked: enforce && !sub.active } });
  } catch {
    return json(me); // data langganan belum siap: login tetap jalan
  }
}
