// Harga & pengaturan paket. Sesuaikan dengan bisnis Anda.
export const PRICE_MONTHLY = 49000;   // Rp per bulan
export const PRICE_YEARLY = 550000;   // Rp per tahun
export const TRIAL_DAYS = 3;          // lama percobaan untuk toko baru
export const QRIS_NAME = "Nama Merchant QRIS Anda";

export type PayMethod = { id: string; name: string; kind: "qris" | "ewallet"; number?: string; holder?: string; hint?: string; color: string };

// GANTI nomor dan nama pemilik dengan akun Anda yang asli.
export const PAY_METHODS: PayMethod[] = [
  { id: "qris", name: "QRIS", kind: "qris", color: "#14213d", hint: "Scan dengan DANA, GoPay, ShopeePay, OVO, atau m-banking apa pun" },
  { id: "dana", name: "DANA", kind: "ewallet", number: "081234567890", holder: "Nama Pemilik Akun", color: "#118EEA" },
  { id: "gopay", name: "GoPay", kind: "ewallet", number: "081234567890", holder: "Nama Pemilik Akun", color: "#00AA13" },
  { id: "shopeepay", name: "ShopeePay", kind: "ewallet", number: "081234567890", holder: "Nama Pemilik Akun", color: "#EE4D2D" },
];
