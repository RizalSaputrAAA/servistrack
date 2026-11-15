import { createHash } from "crypto";

// Integrasi Midtrans Snap. Sandbox/produksi dipilih lewat env.
const SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const PRODUCTION_URL = "https://app.midtrans.com/snap/v1/transactions";

export function midtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const production = process.env.MIDTRANS_PRODUCTION === "true";
  return { serverKey, clientKey, production, enabled: serverKey.length > 0 };
}

export type SnapResult = { token: string; redirect_url: string };

// Buat transaksi Snap, kembalikan redirect_url untuk dibuka di browser.
export async function createSnapTransaction(params: {
  orderId: string;
  amount: number;
  itemName: string;
  customer: { name: string; email?: string | null; phone?: string | null };
  finishUrl?: string;
}): Promise<SnapResult> {
  const { serverKey, production, enabled } = midtransConfig();
  if (!enabled) throw new Error("Pembayaran online belum dikonfigurasi");

  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const body: any = {
    transaction_details: { order_id: params.orderId, gross_amount: params.amount },
    item_details: [{
      id: params.orderId.slice(0, 50),
      price: params.amount,
      quantity: 1,
      name: params.itemName.slice(0, 50),
    }],
    customer_details: {
      first_name: params.customer.name?.slice(0, 50) || "Pemilik Toko",
      email: params.customer.email || undefined,
      phone: params.customer.phone || undefined,
    },
  };
  if (params.finishUrl) body.callbacks = { finish: params.finishUrl };

  const res = await fetch(production ? PRODUCTION_URL : SANDBOX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirect_url) {
    const msg = Array.isArray(data?.error_messages) ? data.error_messages.join(", ") : "";
    throw new Error(msg || `Midtrans menolak permintaan (HTTP ${res.status})`);
  }
  return { token: data.token, redirect_url: data.redirect_url };
}

// Verifikasi notifikasi webhook: SHA512(order_id + status_code + gross_amount + serverKey).
export function verifySignature(p: {
  order_id?: string; status_code?: string; gross_amount?: string; signature_key?: string;
}) {
  const { serverKey } = midtransConfig();
  if (!serverKey || !p.signature_key) return false;
  const raw = `${p.order_id || ""}${p.status_code || ""}${p.gross_amount || ""}${serverKey}`;
  const expected = createHash("sha512").update(raw).digest("hex");
  return expected === p.signature_key;
}
