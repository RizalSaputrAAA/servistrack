"use client";
import Link from "next/link";

const LANGKAH = [
  {
    n: 1, judul: "Daftar toko", waktu: "± 2 menit",
    isi: "Buka halaman Daftar, isi nama toko, alamat, nomor WhatsApp, nama Anda, lalu email dan sandi. Gunakan email asli — dipakai untuk masuk dan reset sandi.",
    link: "/daftar", label: "Daftar toko",
  },
  {
    n: 2, judul: "Masuk sebagai pemilik", waktu: "± 30 detik",
    isi: "Setelah mendaftar, masuk dengan email dan sandi yang tadi. Akun pertama otomatis berperan Pemilik toko, dengan masa percobaan 3 hari.",
    link: "/login", label: "Masuk",
  },
  {
    n: 3, judul: "Tambahkan staf", waktu: "± 1 menit",
    isi: "Di menu Staf, tambahkan kasir dan teknisi (nama, email, sandi awal). Setiap staf bisa mengganti sandinya sendiri lewat menu Ganti sandi.",
    link: "/staf", label: "Kelola staf",
  },
  {
    n: 4, judul: "Mulai melayani pelanggan", waktu: "kapan saja",
    isi: "Kasir membuat tiket baru di Tiket baru. Pelanggan cukup membuka halaman depan dan memasukkan kode tiket untuk melihat status, biaya, dan menyetujui perbaikan.",
    link: "/kasir/tickets/new", label: "Buat tiket",
  },
  {
    n: 5, judul: "Pilih paket langganan", waktu: "± 1 menit",
    isi: "Buka Langganan, pilih Bulanan (Rp 49.000) atau Tahunan (Rp 550.000), lalu pilih metode pembayaran: QRIS atau e-wallet DANA/ShopeePay.",
    link: "/langganan", label: "Buka langganan",
  },
  {
    n: 6, judul: "Bayar & aktifkan", waktu: "maks. 1×24 jam",
    isi: "Bayar dengan nominal TEPAT sesuai tagihan (sudah termasuk kode unik agar mudah dicocokkan), tekan “Saya sudah bayar”, lalu tunggu verifikasi. Setelah disetujui, masa aktif bertambah 1 bulan atau 1 tahun.",
    link: "/langganan", label: "Cek tagihan",
  },
];

export default function Panduan() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-brand">Cara memakai ServisTrack</h1>
        <p className="mt-2 text-slate-600">
          Panduan singkat dari daftar toko sampai langganan aktif. Semuanya bisa dilakukan sendiri, tanpa perlu menghubungi admin.
        </p>
      </div>

      <ol className="space-y-4">
        {LANGKAH.map((s) => (
          <li key={s.n} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">
                    {s.n}
                  </span>
                  {s.judul}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{s.isi}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s.waktu}</span>
                <Link className="btn-ghost whitespace-nowrap" href={s.link}>{s.label}</Link>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="card space-y-2">
        <h2 className="font-semibold">Hal yang sering ditanyakan</h2>
        <p className="text-sm text-slate-600">
          <b>Email saya sudah dipakai orang lain?</b> Satu email hanya untuk satu akun. Kalau akun Anda tidak bisa dibuat,
          coba masuk dulu atau gunakan halaman Lupa sandi.
        </p>
        <p className="text-sm text-slate-600">
          <b>Lupa sandi?</b> Buka <Link className="underline" href="/lupa-sandi">Lupa sandi</Link>. Bila email tidak masuk,
          pemilik toko lain di tim Anda bisa mereset dari menu Staf.
        </p>
        <p className="text-sm text-slate-600">
          <b>Pelanggan perlu akun?</b> Tidak. Mereka hanya memasukkan kode tiket di halaman depan.
        </p>
        <p className="text-sm text-slate-600">
          <b>Tidak yakin mau coba dulu?</b> Lihat <Link className="underline" href="/demo">akun demo</Link> untuk mencoba tanpa mendaftar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className="btn-primary" href="/daftar">Daftar toko sekarang</Link>
        <Link className="btn-ghost" href="/demo">Coba akun demo</Link>
      </div>
    </main>
  );
}
