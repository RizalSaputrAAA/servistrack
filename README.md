# ServisTrack (MVP Demo Day 16 Nov 2026)

## Menjalankan di komputer
1. `npm install`
2. Buat file `.env.local` (salin dari `.env.example`), isi 4 nilainya
3. `npm run dev` lalu buka http://localhost:3000
4. `npm test` untuk unit test triage + konfigurasi paket/langganan

## Database
Jalankan di Supabase SQL Editor, berurutan: `supabase/01_schema.sql`, `02_seed.sql`,
lalu setelah membuat 3 user di Authentication: `03_profiles.sql`.
Terakhir `supabase/04_subscription.sql` (aman dijalankan berulang kali).

## Deploy
Push ke GitHub, import di Vercel, isi 4 environment variable yang sama.
Region fungsi diatur di `vercel.json` (Tokyo, dekat database).
Variabel NEXT_PUBLIC_* bertipe Config; SUPABASE_SERVICE_ROLE_KEY bertipe Secret.

## Akun demo
owner@ / kasir@ / teknisi@servistrack.id. Tiket demo: SV-2026-0003.

## Pendaftaran toko & sandi
- Toko baru daftar mandiri di `/daftar` (nama toko, alamat, WA, nama pemilik, email, password).
  Akun pemilik langsung aktif tanpa verifikasi email dan mendapat percobaan 3 hari.
- Lupa sandi: `/lupa-sandi` mengirim tautan reset Supabase ke email terdaftar; tautan
  mengarah ke `/atur-sandi` untuk membuat sandi baru.
- Cadangan: pemilik platform dapat mereset sandi staf dari `/admin` (kartu "Reset sandi staf").
- Supaya email reset benar-benar terkirim, atur SMTP kustom di Supabase
  (Project Settings → Auth → SMTP). Email bawaan Supabase dibatasi beberapa per jam.
- `/admin` bisa dibuka dengan login pemilik toko (role owner) atau dengan `ADMIN_PASSWORD`.
- Toko baru otomatis mendapat 26 suku cadang awal (lihat `lib/seed-parts.ts`).
- Tutup pendaftaran publik: set `REGISTRATION_OPEN=false` di environment.
- Manajemen staf ada di kartu "Staf toko" pada `/admin`: tambah kasir/teknisi/pemilik,
  dan nonaktifkan akun yang tidak dipakai lagi.

## Langganan (bulanan / tahunan)
1. Jalankan `supabase/04_subscription.sql` di Supabase SQL Editor. Skrip ini menambah
   kolom `plan`, `trial_ends_at`, `paid_until` di tabel `shops`, membuat tabel
   `sub_invoices` beserta kolom `method` (metode pembayaran). Idempoten, aman diulang.
2. Tambah environment variable di Vercel: `SUB_ENFORCE=false` dan `ADMIN_PASSWORD=...`
   (password panjang & acak). Jangan pakai nilai contoh.
3. Atur harga, masa percobaan, nama merchant QRIS, dan daftar metode pembayaran di
   `lib/plans.ts` (`PRICE_MONTHLY`, `PRICE_YEARLY`, `TRIAL_DAYS`, `QRIS_NAME`,
   `PAY_METHODS`). Ganti nomor & nama pemilik pada entri e-wallet dengan akun asli Anda;
   `npm test` akan gagal bila format nomor salah atau nama pemilik kosong.
4. Simpan gambar QRIS asli sebagai `public/qris.png` (folder `public/` belum ada — buat bila perlu).
   Tanpa gambar ini, opsi QRIS menampilkan pesan galat; e-wallet tetap bisa dipakai.
5. Pemilik toko mengelola paket di `/langganan` (pilih paket → pilih metode bayar → bayar
   dengan nominal tepat termasuk kode unik → "Saya sudah bayar"). Anda memverifikasi
   pembayaran di `/admin`.
6. Setelah Demo Day, ubah `SUB_ENFORCE=true` lalu Redeploy agar toko yang masa aktifnya
   habis benar-benar terkunci.
