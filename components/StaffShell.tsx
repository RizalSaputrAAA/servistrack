"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSupabase } from "@/lib/supabase-browser";

const Ctx = createContext<any>(null);
export const useMe = () => useContext(Ctx);

// Bungkus semua halaman staf: cek login + peran + langganan, tampilkan navbar.
export default function StaffShell({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const [me, setMe] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    api("/api/me")
      .then((m) => {
        if (m.role !== "owner" && !roles.includes(m.role)) router.replace("/login");
        else if (m.sub?.locked && pathname !== "/langganan") router.replace("/langganan");
        else setMe(m);
      })
      .catch(() => router.replace("/login"));
  }, []);

  if (!me) return <p className="p-8 text-slate-500">Memuat…</p>;

  const logout = async () => {
    await getSupabase().auth.signOut();
    router.replace("/login");
  };
  const canKasir = ["cashier", "owner"].includes(me.role);
  const canTech = ["technician", "owner"].includes(me.role);
  const sub = me.sub;
  let banner: { text: string; red: boolean } | null = null;
  if (me.role === "owner" && sub) {
    if (sub.type === "trial") banner = { text: `Masa percobaan: sisa ${sub.days} hari.`, red: false };
    else if (sub.type === "expired" && sub.enforce) banner = { text: "Langganan berakhir.", red: true };
    else if (sub.type === "paid" && sub.days <= 7) banner = { text: `Langganan berakhir dalam ${sub.days} hari.`, red: false };
  }

  return (
    <Ctx.Provider value={me}>
      {banner && (
        <div className={`px-4 py-2 text-center text-sm ${banner.red ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
          {banner.text}{" "}
          <Link href="/langganan" className="font-bold underline">Kelola langganan</Link>
        </div>
      )}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-bold text-brand">ServisTrack</Link>
          {canKasir && <Link href="/kasir/tickets/new" className="text-sm hover:underline">Tiket Baru</Link>}
          {canKasir && <Link href="/kasir/tickets" className="text-sm hover:underline">Daftar Tiket</Link>}
          {canTech && <Link href="/teknisi/tickets" className="text-sm hover:underline">Antrean Teknisi</Link>}
          {me.role === "owner" && <Link href="/staf" className="text-sm hover:underline">Staf</Link>}
          {me.role === "owner" && <Link href="/langganan" className="text-sm hover:underline">Langganan</Link>}
          <Link href="/ganti-sandi" className="ml-auto text-sm hover:underline">Ganti sandi</Link>
          <span className="text-sm text-slate-500">{me.full_name} ({me.role})</span>
          <button onClick={logout} className="btn-ghost">Keluar</button>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </Ctx.Provider>
  );
}
