"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useMe } from "./StaffShell";
import StatusBadge from "./StatusBadge";
import { NEXT, DIAGNOSIS_LABEL, rupiah, fmtDate } from "@/lib/status";
import { SYMPTOMS } from "@/lib/triage";

const ACTION: Record<string, string> = {
  diagnosing: "Mulai diagnosa",
  in_progress: "Mulai kerjakan",
  done: "Tandai selesai",
};
const symLabel = (c: string) => SYMPTOMS.find((s) => s.code === c)?.label || c;

export default function TicketDetail({ id, justCreated }: { id: string; justCreated?: boolean }) {
  const me = useMe();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState(justCreated ? "Tiket berhasil dibuat. Bagikan kode ke pelanggan." : "");
  const [tech, setTech] = useState("");
  const [cost, setCost] = useState("");
  const [pub, setPub] = useState("");
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState("1");

  const load = () => api(`/api/tickets/${id}`).then(setD).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [id]);

  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const act = async (fn: () => Promise<any>, ok: string) => {
    if (busyRef.current) return; // cegah klik ganda
    busyRef.current = true;
    setBusy(true);
    setErr(""); setMsg("Memproses…");
    try { await fn(); setMsg(ok); } catch (e: any) { setMsg(""); setErr(e.message); }
    await load(); // selalu segarkan status
    busyRef.current = false;
    setBusy(false);
  };

  if (!d) return <p className="text-slate-500">{err || "Memuat tiket…"}</p>;
  const t = d.ticket;
  const isTech = ["technician", "owner"].includes(me.role);
  const isCash = ["cashier", "owner"].includes(me.role);
  const buttons = (NEXT[t.status] || []).filter((s) => ACTION[s] && (s !== "in_progress" || t.approved));
  const portal = typeof window !== "undefined" ? `${location.origin}/track/${t.ticket_code}` : "";
  const waPhone = (t.customer_phone || "").replace(/^0/, "62");
  const waText = encodeURIComponent(`Halo ${t.customer_name}, pantau status servis laptop Anda di: ${portal} (kode ${t.ticket_code})`);
  const partsTotal = d.usage.reduce((a: number, u: any) => a + (u.price_at_use || 0) * u.qty, 0);

  return (
    <div className="space-y-4">
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{t.ticket_code}</p>
            <h1 className="text-xl font-bold">{t.customer_name}</h1>
            <p className="text-sm text-slate-600">{t.customer_phone} — {t.device_brand} {t.device_type}</p>
          </div>
          <StatusBadge status={t.status} big />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {t.symptoms.map((s: string) => (
            <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs">{symLabel(s)}</span>
          ))}
        </div>
        {t.notes && <p className="mt-3 text-sm text-slate-600">Catatan: {t.notes}</p>}
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(portal); setMsg("Link portal disalin"); }}>Salin link portal</button>
          <a className="btn-ghost" target="_blank" href={`https://wa.me/${waPhone}?text=${waText}`}>Kirim via WA</a>
          <button className="btn-ghost" onClick={() => window.print()}>Cetak nota</button>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Hasil triage</h2>
        {t.triage_diagnosis ? (
          <>
            <p className="text-sm">Dugaan: <b>{DIAGNOSIS_LABEL[t.triage_diagnosis] || t.triage_diagnosis}</b> (skor prioritas {t.triage_score})</p>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.round((t.triage_confidence || 0) * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">Keyakinan {Math.round((t.triage_confidence || 0) * 100)}%</p>
          </>
        ) : <p className="text-sm text-slate-500">Belum ada dugaan.</p>}
      </div>

      <div className={`no-print grid gap-4 md:grid-cols-2 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {isCash && !["picked_up", "cancelled"].includes(t.status) && (
          <div className="card">
            <h2 className="mb-2 font-semibold">Tugaskan teknisi</h2>
            <select className="input" value={tech || t.assigned_to || ""} onChange={(e) => setTech(e.target.value)}>
              <option value="">Pilih teknisi</option>
              {d.technicians.map((x: any) => <option key={x.id} value={x.id}>{x.full_name}</option>)}
            </select>
            <button className="btn-primary mt-3" disabled={!tech}
              onClick={() => act(() => api(`/api/tickets/${id}/assign`, { method: "POST", body: { technician_id: tech } }), "Teknisi ditugaskan")}>
              Tugaskan
            </button>
          </div>
        )}

        {buttons.length > 0 && (
          <div className="card">
            <h2 className="mb-2 font-semibold">Ubah status</h2>
            <div className="flex flex-wrap gap-2">
              {buttons.map((s) => (
                <button key={s} className="btn-primary"
                  onClick={() => {
                    if (s === "done" && !confirm("Semua part yang terpakai sudah dicatat?")) return;
                    act(() => api(`/api/tickets/${id}/status`, { method: "PATCH", body: { to: s } }), "Status diperbarui");
                  }}>
                  {ACTION[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {t.status === "diagnosing" && (
          <div className="card">
            <h2 className="mb-2 font-semibold">Penawaran biaya</h2>
            <label className="label">Estimasi biaya (Rp)</label>
            <input className="input" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            <label className="label mt-3">Rincian untuk pelanggan</label>
            <textarea className="input" rows={3} value={pub} onChange={(e) => setPub(e.target.value)} placeholder="Contoh: Ganti LCD 14 inch + jasa. Estimasi 2 hari." />
            <button className="btn-primary mt-3"
              onClick={() => act(() => api(`/api/tickets/${id}/quote`, { method: "POST", body: { estimated_cost: cost, public_note: pub } }), "Penawaran terkirim")}>
              Kirim penawaran
            </button>
          </div>
        )}

        {t.status === "in_progress" && isTech && (
          <div className="card">
            <h2 className="mb-2 font-semibold">Pemakaian part</h2>
            <select className="input" value={partId} onChange={(e) => setPartId(e.target.value)}>
              <option value="">Pilih part</option>
              {d.parts.map((p: any) => (
                <option key={p.id} value={p.id} disabled={p.stock < 1}>{p.name} (stok {p.stock})</option>
              ))}
            </select>
            <input className="input mt-2" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            <button className="btn-primary mt-3" disabled={!partId}
              onClick={() => act(() => api(`/api/tickets/${id}/parts`, { method: "POST", body: { part_id: partId, qty } }), "Part dicatat, stok berkurang")}>
              Tambah part
            </button>
          </div>
        )}

        {t.status === "done" && isCash && (
          <div className="card">
            <h2 className="mb-2 font-semibold">Pembayaran</h2>
            <p className="mb-2 text-sm text-slate-600">Estimasi: {rupiah(t.estimated_cost)}</p>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Tunai</option><option value="qris">QRIS</option><option value="transfer">Transfer</option>
            </select>
            <input className="input mt-2" type="number" placeholder="Jumlah dibayar (Rp)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn-primary mt-3"
              onClick={() => act(() => api(`/api/tickets/${id}/payment`, { method: "POST", body: { method, amount } }), "Lunas. Tiket ditandai sudah diambil")}>
              Tandai lunas
            </button>
          </div>
        )}
      </div>

      {d.usage.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-semibold">Part terpakai</h2>
          <ul className="space-y-1 text-sm">
            {d.usage.map((u: any) => (
              <li key={u.id} className="flex justify-between">
                <span>{u.parts?.name} x{u.qty}</span><span>{rupiah(u.price_at_use * u.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t pt-2 text-right text-sm font-semibold">Total part: {rupiah(partsTotal)}</p>
        </div>
      )}

      {d.payments.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-semibold">Pembayaran tercatat</h2>
          {d.payments.map((p: any) => (
            <p key={p.id} className="text-sm">{rupiah(p.amount)} via {p.method} — {fmtDate(p.paid_at)}</p>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold">Riwayat</h2>
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
          {d.events.map((e: any) => (
            <li key={e.id}>
              <p className="text-sm font-medium">{e.note}</p>
              <p className="text-xs text-slate-500">{fmtDate(e.created_at)}{e.is_public ? "" : " (internal)"}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
