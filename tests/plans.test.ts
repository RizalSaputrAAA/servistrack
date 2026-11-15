import test from "node:test";
import assert from "node:assert/strict";
import { PAY_METHODS, PRICE_MONTHLY, PRICE_YEARLY, TRIAL_DAYS, QRIS_NAME } from "../lib/plans";

// Uji konfigurasi paket & metode pembayaran. Jalankan: npm test

test("metode pembayaran: id unik, QRIS tersedia, warna valid", () => {
  const ids = PAY_METHODS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length, "id metode tidak boleh duplikat");
  assert.ok(ids.includes("qris"), "harus ada metode QRIS");
  for (const m of PAY_METHODS) {
    assert.ok(m.name.length > 1, `${m.id}: nama metode kosong`);
    assert.match(m.color, /^#[0-9a-fA-F]{6}$/, `${m.id}: warna harus hex 6 digit`);
  }
});

test("metode e-wallet punya nomor & nama pemilik", () => {
  const ewallet = PAY_METHODS.filter((m) => m.kind === "ewallet");
  assert.ok(ewallet.length > 0, "minimal satu metode e-wallet");
  for (const m of ewallet) {
    assert.match(m.number || "", /^0\d{8,13}$/, `${m.name}: nomor e-wallet belum diisi dengan benar`);
    assert.ok((m.holder || "").trim().length > 2, `${m.name}: nama pemilik akun belum diisi`);
  }
});

test("harga paket masuk akal", () => {
  assert.ok(PRICE_MONTHLY > 0 && PRICE_YEARLY > 0, "harga harus positif");
  assert.ok(PRICE_YEARLY < PRICE_MONTHLY * 12, "tahunan harus lebih murah dari 12x bulanan");
  assert.ok(TRIAL_DAYS >= 0, "masa percobaan tidak boleh negatif");
  assert.ok(QRIS_NAME.trim().length > 0, "nama merchant QRIS belum diisi");
});
