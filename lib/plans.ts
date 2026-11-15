// Harga & pengaturan paket. Sesuaikan dengan bisnis Anda.
export const PRICE_MONTHLY = 49000;   // Rp per bulan
export const PRICE_YEARLY = 550000;   // Rp per tahun
export const TRIAL_DAYS = 3;          // lama percobaan untuk toko baru
export const QRIS_NAME = "Internet Of Things";

export type PayMethod = { id: string; name: string; kind: "qris" | "ewallet"; number?: string; holder?: string; hint?: string; color: string };

export const PAY_METHODS: PayMethod[] = [
  { id: "qris", name: "QRIS", kind: "qris", color: "#14213d", hint: "Scan dengan DANA, GoPay, ShopeePay, OVO, atau m-banking apa pun" },
  { id: "dana", name: "DANA", kind: "ewallet", number: "082256970246", holder: "Internet Of Things", color: "#118EEA" },
  { id: "shopeepay", name: "ShopeePay", kind: "ewallet", number: "082256970246", holder: "Internet Of Things", color: "#EE4D2D" },
];
