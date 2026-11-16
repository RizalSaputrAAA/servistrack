"use client";
import { useEffect, useState } from "react";
import { getJson, download } from "@/lib/api";
import { rupiah } from "@/lib/status";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Pontianak" }).format(new Date());
const SHOW = 200; // baris yang ditampilkan di layar; file ekspor memuat semuanya

type Props = { title?: string; endpoint: string; base: string; headers?: Record<string, string> };

// headers: header tambahan untuk API (mis. x-admin-password di halaman admin).
export default function ReportView({ title, endpoint, base, headers }: Props) {
  const [from, setFrom] = useState(today().slice(0, 8) + "01");
  const [to, setTo] = useState(today());
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const qs = `from=${from}&to=${to}`;
  const load = async () => {
    setBusy(true); setErr("");
    try { setD(await getJson(`${endpoint}?${qs}`, headers)); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const exp = async (fmt: "csv" | "xlsx") => {
    setErr("");
    try { await download(`${endpoint}?${qs}&format=${fmt}`, `${base}_${from}_${to}.${fmt}`, headers); }
    catch (e: any) { setErr(e.message); }
  };
  const fmt = (v: any, money?: boolean) => (money ? rupiah(v) : v ?? "");

  return (
    <div className="space-y-4">
      {title && <h1 className="text-2xl font-bold">{title}</h1>}

      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="from">Dari</label>
          <input id="from" type="date" className="input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="to">Sampai</label>
          <input id="to" type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={load} disabled={busy}>{busy ? "Memuat…" : "Tampilkan"}</button>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost" onClick={() => exp("csv")} disabled={!d}>Unduh CSV</button>
          <button className="btn-ghost" onClick={() => exp("xlsx")} disabled={!d}>Unduh Excel</button>
        </div>
      </div>

      {err && <p className="err">{err}</p>}

      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.cards.map((c: any) => (
              <div key={c.label} className="card">
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold">{c.kind === "money" ? rupiah(c.value) : c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {d.groups.map((g: any) => (
              <div key={g.title} className="card p-0 overflow-x-auto">
                <h2 className="px-5 pt-4 font-semibold">{g.title}</h2>
                <table className="mt-2 w-full">
                  <thead className="border-b border-slate-200">
                    <tr><th className="th">Kelompok</th><th className="th text-right">Jumlah</th><th className="th text-right">Total</th></tr>
                  </thead>
                  <tbody>
                    {g.items.map((i: any) => (
                      <tr key={i.label} className="border-b border-slate-100">
                        <td className="td">{i.label}</td>
                        <td className="td text-right">{i.count}</td>
                        <td className="td text-right font-medium">{rupiah(i.total)}</td>
                      </tr>
                    ))}
                    {g.items.length === 0 && <tr><td className="td text-slate-500" colSpan={3}>Tidak ada data pada periode ini.</td></tr>}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="card overflow-x-auto p-0">
            <h2 className="px-5 pt-4 font-semibold">Rincian transaksi ({d.rows.length})</h2>
            <table className="mt-2 w-full">
              <thead className="border-b border-slate-200">
                <tr>{d.columns.map((c: any) => <th key={c.key} className={`th ${c.money ? "text-right" : ""}`}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {d.rows.slice(0, SHOW).map((r: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100">
                    {d.columns.map((c: any) => <td key={c.key} className={`td ${c.money ? "text-right" : ""}`}>{fmt(r[c.key], c.money)}</td>)}
                  </tr>
                ))}
                {d.rows.length === 0 && <tr><td className="td text-slate-500" colSpan={d.columns.length}>Belum ada transaksi pada periode ini.</td></tr>}
              </tbody>
            </table>
            {d.rows.length > SHOW && <p className="px-5 py-3 text-xs text-slate-500">Menampilkan {SHOW} baris pertama. Unduh CSV/Excel untuk data lengkap.</p>}
          </div>
        </>
      )}
    </div>
  );
}
