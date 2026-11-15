"use client";
import Link from "next/link";
import { useState } from "react";

// Halaman bantuan untuk sesi demo. Berisi akun contoh yang datanya memang fiktif.
// Hapus halaman ini (dan tautannya) sebelum dipakai produksi sungguhan.
const AKUN = [
  { role: "Pemilik toko", email: "owner@servistrack.id", pass: "DemoServis2026", akses: "Semua menu + kelola langganan + /admin" },
  { role: "Kasir", email: "kasir@servistrack.id", pass: "DemoServis2026", akses: "Buat tiket, pembayaran, serah terima" },
  { role: "Teknisi", email: "teknisi@servistrack.id", pass: "DemoServis2026", akses: "Antrean tugas, update status, pemakaian sparepart" },
];

export default function Demo() {
  const [copied, setCopied] = useState("");
  const copy = async (text: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      setTimeout(() => setCopied(""), 1500);
    } catch { /* abaikan */ }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-brand">Akun demo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pakai akun di bawah untuk mencoba ServisTrack. Datanya data contoh, aman untuk dicoba-coba.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Peran</th>
              <th className="th">Email</th>
              <th className="th">Sandi</th>
              <th className="th">Bisa apa</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {AKUN.map((a) => (
              <tr key={a.email} className="border-t border-slate-100">
                <td className="td"><b>{a.role}</b></td>
                <td className="td">{a.email}</td>
                <td className="td font-mono">{a.pass}</td>
                <td className="td text-xs text-slate-500">{a.akses}</td>
                <td className="td">
                  <button className="btn-ghost whitespace-nowrap"
                    onClick={() => copy(`${a.email} / ${a.pass}`, a.email)}>
                    {copied === a.email ? "Tersalin" : "Salin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold">Catatan</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Semua akun memakai sandi yang sama: <b className="font-mono">DemoServis2026</b></li>
          <li>Halaman <b>/admin</b> dibuka dengan login pemilik toko, atau dengan password admin (khusus pengelola).</li>
          <li>Toko contoh: <b>Servis Laptop Mitra Pontianak</b>, status percobaan 3 hari.</li>
          <li>Pelanggan bisa melacak tiket tanpa login di halaman utama memakai kode tiket.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className="btn-primary" href="/login">Masuk sekarang</Link>
        <Link className="btn-ghost" href="/daftar">Coba daftar toko baru</Link>
        <Link className="btn-ghost" href="/">Halaman pelacakan</Link>
        <Link className="btn-ghost" href="/panduan">Panduan lengkap</Link>
      </div>
    </main>
  );
}
