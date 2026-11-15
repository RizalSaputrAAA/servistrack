# ServisTrack (MVP Demo Day 16 Nov 2026)

## Menjalankan di komputer
1. `npm install`
2. Buat file `.env.local` (salin dari `.env.example`), isi 4 nilainya
3. `npm run dev` lalu buka http://localhost:3000
4. `npm test` untuk unit test triage

## Database
Jalankan di Supabase SQL Editor, berurutan: `supabase/01_schema.sql`, `02_seed.sql`,
lalu setelah membuat 3 user di Authentication: `03_profiles.sql`.

## Deploy
Push ke GitHub, import di Vercel, isi 4 environment variable yang sama.
Region fungsi diatur di `vercel.json` (Tokyo, dekat database).
Variabel NEXT_PUBLIC_* bertipe Config; SUPABASE_SERVICE_ROLE_KEY bertipe Secret.

## Akun demo
owner@ / kasir@ / teknisi@servistrack.id. Tiket demo: SV-2026-0003.

## Langganan (bulanan / tahunan)
1. Jalankan `supabase/04_subscription.sql` di Supabase SQL Editor.
2. Tambah environment variable di Vercel: `SUB_ENFORCE=false` dan `ADMIN_PASSWORD=...` (password panjang).
3. Atur harga di `lib/plans.ts`. Simpan gambar QRIS sebagai `public/qris.png`.
4. Pemilik toko mengelola paket di `/langganan`. Anda memverifikasi pembayaran di `/admin`.
5. Setelah Demo Day, ubah `SUB_ENFORCE=true` lalu Redeploy.
