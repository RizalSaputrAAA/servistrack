"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { DIAGNOSIS_LABEL, rupiah, fmtDate, STATUS } from "@/lib/status";

export default function Track() {
  const { code } = useParams() as { code: string };
  const [t, setT] = useState<any>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [askReject, setAskReject] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await fetch(`/api/track/${code}`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) { setErr(j.error); setT(null); } else { setErr(""); setT(j); }
  };
  useEffect(() => { load(); }, [code]);

  const send = async (path: string, body?: any, ok?: string) => {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/track/${code}/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) setErr(j.error); else { setMsg(ok || "Berhasil"); setAskReject(false); await load(); }
  };

  const wa = t?.shop?.phone ? `https://wa.me/${String(t.shop.phone).replace(/^0/, "62")}` : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-brand underline">← Kembali ke beranda</Link>

      {err && !t && (
        <div className="card mt-6">
          <p className="err">{err}</p>
          <Link href="/" className="btn-primary mt-4">Coba kode lain</Link>
        </div>
      )}

      {t && (
        <div className="mt-4 space-y-4">
          {msg && <p className="ok">{msg}</p>}
          {err && <p className="err">{err}</p>}

          <div className="card">
            <p className="text-sm text-slate-500">{t.ticket_code}</p>
            <h1 className="text-xl font-bold">{t.device || "Laptop"}</h1>
            <p className="text-sm text-slate-600">Atas nama {t.customer_name}, masuk {fmtDate(t.created_at)}</p>
            <div className="mt-4"><StatusBadge status={t.status} big /></div>
          </div>

          {t.diagnosis && (
            <div className="card">
              <h2 className="font-semibold">Dugaan awal kerusakan</h2>
              <p className="mt-1 text-sm">{DIAGNOSIS_LABEL[t.diagnosis] || t.diagnosis}</p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.round((t.confidence || 0) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Keyakinan sistem {Math.round((t.confidence || 0) * 100)}%. Hasil akhir dipastikan teknisi.</p>
            </div>
          )}

          {t.estimated_cost && (
            <div className="card">
              <h2 className="font-semibold">Penawaran biaya</h2>
              <p className="mt-1 text-2xl font-bold">{rupiah(t.estimated_cost)}</p>
              {t.public_note && <p className="mt-2 text-sm text-slate-600">{t.public_note}</p>}

              {t.status === "waiting_approval" && !askReject && (
                <div className="mt-4 flex gap-3">
                  <button disabled={busy} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => send("approve", {}, "Terima kasih, perbaikan akan segera dikerjakan.")}>Setujui</button>
                  <button disabled={busy} className="btn-danger flex-1" onClick={() => setAskReject(true)}>Tolak</button>
                </div>
              )}
              {askReject && (
                <div className="mt-4">
                  <label className="label">Alasan penolakan</label>
                  <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className="mt-3 flex gap-3">
                    <button disabled={busy} className="btn-danger" onClick={() => send("reject", { reason }, "Penawaran ditolak. Toko akan menghubungi Anda.")}>Kirim penolakan</button>
                    <button className="btn-ghost" onClick={() => setAskReject(false)}>Batal</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h2 className="mb-3 font-semibold">Perkembangan</h2>
            <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
              {t.events.map((e: any, i: number) => (
                <li key={i}>
                  <p className="text-sm font-medium">{STATUS[e.to_status]?.icon} {e.note}</p>
                  <p className="text-xs text-slate-500">{fmtDate(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost" onClick={load}>Refresh status</button>
            {wa && <a className="btn-ghost" href={wa} target="_blank">Hubungi toko via WA</a>}
          </div>
        </div>
      )}
    </main>
  );
}
