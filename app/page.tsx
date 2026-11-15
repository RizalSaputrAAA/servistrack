"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const WA = process.env.NEXT_PUBLIC_WA_NUMBER || "";

export default function Home() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) router.push(`/track/${encodeURIComponent(code.trim().toUpperCase())}`);
  };
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-brand">ServisTrack</span>
          {WA && <a className="btn-ghost" href={`https://wa.me/${WA}`} target="_blank">Hubungi via WA</a>}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Cek status servis laptop Anda</h1>
        <p className="mt-3 max-w-prose text-slate-600">
          Masukkan kode tiket untuk melihat tahap pengerjaan, biaya, dan menyetujui perbaikan tanpa perlu menelepon toko.
        </p>
        <form onSubmit={go} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            className="input py-3 text-lg"
            placeholder="SV-2026-0001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Kode tiket"
          />
          <button className="btn-primary px-8 py-3 text-base">Cek status</button>
        </form>
        <p className="mt-3 text-sm text-slate-500">Kode tiket diberikan oleh kasir saat Anda menyerahkan laptop.</p>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
        Pontianak, Kalimantan Barat · <Link href="/login" className="underline">Masuk staf</Link>
      </footer>
    </div>
  );
}
