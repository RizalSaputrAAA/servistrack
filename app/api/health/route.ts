import { json } from "@/lib/auth";
export const dynamic = "force-dynamic";

// Endpoint diagnostik sementara: hanya melaporkan ADA/TIDAK dan panjang nilai,
// tidak pernah mengembalikan isi rahasia.
export async function GET() {
  const adm = process.env.ADMIN_PASSWORD || "";
  return json({
    ok: true,
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
    env: {
      adminPasswordSet: adm.length > 0,
      adminPasswordLen: adm.length,
      subEnforce: process.env.SUB_ENFORCE ?? null,
      supabaseUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      waNumberSet: !!process.env.NEXT_PUBLIC_WA_NUMBER,
    },
  });
}
