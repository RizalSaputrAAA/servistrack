"use client";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) { setErr("Masukkan kode tiket dulu"); return; }
    if (!/^SV-\d{4}-\d{3,5}$/.test(c)) { setErr("Format kode: SV-2026-0001"); return; }
    setErr("");
    window.location.href = `/track/${encodeURIComponent(c)}`;
  };
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-brand">ServisTrack</span>
          <nav className="flex gap-3 text-sm">
            <Link className="btn-ghost" href="/daftar">Daftar toko</Link>
            <Link className="btn-ghost" href="/login">Masuk staf</Link>
          </nav>
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
            onChange={(e) => { setCode(e.target.value); setErr(""); }}
            aria-label="Kode tiket"
          />
          <button className="btn-primary px-8 py-3 text-base">Cek status</button>
        </form>
        {err && <p className="err mt-3">{err}</p>}
        <p className="mt-3 text-sm text-slate-500">Kode tiket diberikan oleh kasir saat Anda menyerahkan laptop.</p>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
        Pontianak, Kalimantan Barat · <Link href="/panduan" className="underline">Panduan</Link> · <Link href="/demo" className="underline">Akun demo</Link>
      </footer>
    </div>
  );
}
