import test from "node:test";
import assert from "node:assert/strict";
import { parseRange, toCsv, groupBy } from "../lib/report";

const cols = [{ key: "a", label: "A" }, { key: "n", label: "Jumlah", money: true }];

test("CSV: BOM, pemisah ; dan quoting", () => {
  const out = toCsv(cols, [{ a: 'Budi; "S"', n: 900000 }]);
  assert.ok(out.startsWith("\uFEFF"));
  assert.ok(out.includes('"Budi; ""S"""' + ";900000"));
});

test("CSV: cegah formula injection (=, +, -, @) pada teks, bukan angka", () => {
  const out = toCsv(cols, [{ a: "=HYPERLINK(1)", n: -5 }]);
  assert.ok(out.includes("'=HYPERLINK(1);-5"));
});

test("rentang tanggal: batas atas = awal hari setelah 'to' (WIB)", () => {
  const r = parseRange(new URL("http://x/?from=2026-11-01&to=2026-11-30"));
  assert.equal(r.fromISO, "2026-10-31T17:00:00.000Z");
  assert.equal(r.toISO, "2026-11-30T17:00:00.000Z");
});

test("rentang tanggal: input buruk ditolak", () => {
  assert.throws(() => parseRange(new URL("http://x/?from=abc&to=2026-11-30")));
  assert.throws(() => parseRange(new URL("http://x/?from=2026-11-30&to=2026-11-01")));
  assert.throws(() => parseRange(new URL("http://x/?from=2020-01-01&to=2026-11-01")));
});

test("groupBy menjumlahkan total dan hitungan", () => {
  const g = groupBy([{ k: "x", v: 10 }, { k: "x", v: 5 }, { k: "y", v: 1 }], (r) => r.k, (r) => r.v);
  assert.deepEqual(g, [{ label: "x", total: 15, count: 2 }, { label: "y", total: 1, count: 1 }]);
});
