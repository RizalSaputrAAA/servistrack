// Utilitas laporan: rentang tanggal (WIB), CSV, XLSX, dan response unduhan.
// Tidak mengimpor Next.js agar mudah diuji. exceljs dimuat dinamis (hanya saat ekspor XLSX).

export const TZ = "Asia/Pontianak"; // WIB, UTC+7 (Indonesia tidak memakai DST)

export type Col = { key: string; label: string; money?: boolean; width?: number };
export type Report = {
  range: { from: string; to: string };
  cards: { label: string; value: number; kind: "money" | "number" }[];
  groups: { title: string; items: { label: string; total: number; count: number }[] }[];
  columns: Col[];
  rows: Record<string, any>[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const todayWIB = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
export const wib = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, dateStyle: "short", timeStyle: "medium" }).format(new Date(iso)) : "";
export const dayWIB = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));

// ?from=YYYY-MM-DD&to=YYYY-MM-DD (inklusif). Default: tanggal 1 bulan ini s/d hari ini.
export function parseRange(url: URL) {
  const today = todayWIB();
  const from = url.searchParams.get("from") || today.slice(0, 8) + "01";
  const to = url.searchParams.get("to") || today;
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) throw new Error("Format tanggal harus YYYY-MM-DD");
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86_400_000); // awal hari setelah 'to'
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error("Tanggal tidak valid");
  if (end <= start) throw new Error("Tanggal akhir harus sama atau setelah tanggal awal");
  if ((end.getTime() - start.getTime()) / 86_400_000 > 366) throw new Error("Rentang maksimal 366 hari");
  return { from, to, fromISO: start.toISOString(), toISO: end.toISOString() };
}

// Supabase membatasi 1000 baris per query: ambil bertahap.
export async function fetchAll<T = any>(build: (a: number, b: number) => PromiseLike<{ data: any; error: any }>) {
  const out: T[] = [];
  const size = 1000;
  for (let i = 0; ; i += size) {
    const { data, error } = await build(i, i + size - 1);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < size) break;
  }
  return out;
}

// Hasil join many-to-one bisa berupa objek atau array, tergantung versi tipe.
export const one = (x: any) => (Array.isArray(x) ? x[0] : x) || {};

// Kelompokkan baris menjadi {label,total,count}
export function groupBy<T>(rows: T[], label: (r: T) => string, amount: (r: T) => number) {
  const m = new Map<string, { label: string; total: number; count: number }>();
  for (const r of rows) {
    const k = label(r);
    const g = m.get(k) || { label: k, total: 0, count: 0 };
    g.total += amount(r); g.count += 1;
    m.set(k, g);
  }
  return [...m.values()];
}

// ---------- CSV ----------
// Pemisah ';' karena Excel dengan pengaturan regional Indonesia memakai ';' sebagai pemisah daftar.
// BOM UTF-8 supaya karakter non-ASCII tampil benar di Excel.
export function toCsv(columns: Col[], rows: Record<string, any>[], sep = ";") {
  const esc = (v: any) => {
    if (v == null) return "";
    if (typeof v === "number") return String(v);
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // cegah formula injection di Excel
    return /[";,\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.label)).join(sep)];
  for (const r of rows) lines.push(columns.map((c) => esc(r[c.key])).join(sep));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

// ---------- XLSX ----------
export async function toXlsx(rep: Report, title: string) {
  const mod: any = await import("exceljs");
  const ExcelJS = mod.default || mod; // exceljs adalah paket CommonJS
  const wb = new ExcelJS.Workbook();
  wb.creator = "ServisTrack";
  const bold = { bold: true };
  const MONEY = '"Rp" #,##0';

  // Sheet 1: Ringkasan
  const s = wb.addWorksheet("Ringkasan");
  s.columns = [{ width: 34 }, { width: 20 }, { width: 12 }];
  s.addRow([title]).font = { bold: true, size: 14 };
  s.addRow([`Periode: ${rep.range.from} s/d ${rep.range.to} (WIB)`]);
  s.addRow([]);
  for (const c of rep.cards) {
    const r = s.addRow([c.label, c.value]);
    r.getCell(1).font = bold;
    if (c.kind === "money") r.getCell(2).numFmt = MONEY;
  }
  for (const g of rep.groups) {
    s.addRow([]);
    const h = s.addRow([g.title, "Total", "Jumlah"]);
    h.font = bold;
    for (const i of g.items) {
      const r = s.addRow([i.label, i.total, i.count]);
      r.getCell(2).numFmt = MONEY;
    }
  }

  // Sheet 2: Data rinci + baris total (rumus SUM, ikut berubah jika data diedit)
  const d = wb.addWorksheet("Data");
  d.columns = rep.columns.map((c) => ({ header: c.label, key: c.key, width: c.width || (c.money ? 18 : 22) }));
  d.getRow(1).font = bold;
  d.views = [{ state: "frozen", ySplit: 1 }];
  rep.rows.forEach((r) => d.addRow(r));
  rep.columns.forEach((c, idx) => c.money && (d.getColumn(idx + 1).numFmt = MONEY));
  if (rep.rows.length) {
    const tot = d.addRow({});
    tot.getCell(1).value = "TOTAL";
    tot.font = bold;
    rep.columns.forEach((c, idx) => {
      if (!c.money) return;
      const col = d.getColumn(idx + 1).letter;
      const sum = rep.rows.reduce((a, r) => a + (Number(r[c.key]) || 0), 0);
      tot.getCell(idx + 1).value = { formula: `SUM(${col}2:${col}${rep.rows.length + 1})`, result: sum };
    });
  }
  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

// ---------- Response ----------
const HEAD = { "Cache-Control": "no-store" };

export async function respond(req: Request, rep: Report, base: string, title: string) {
  const fmt = new URL(req.url).searchParams.get("format") || "json";
  const name = `${base}_${rep.range.from}_${rep.range.to}`;
  if (fmt === "csv")
    return new Response(toCsv(rep.columns, rep.rows), {
      headers: { ...HEAD, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` },
    });
  if (fmt === "xlsx")
    return new Response(await toXlsx(rep, title), {
      headers: {
        ...HEAD,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}.xlsx"`,
      },
    });
  return new Response(JSON.stringify(rep), { headers: { ...HEAD, "Content-Type": "application/json" } });
}
