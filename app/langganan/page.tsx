"use client";
import { useEffect, useState } from "react";
import StaffShell, { useMe } from "@/components/StaffShell";
import { api } from "@/lib/api";
import { rupiah, fmtDate } from "@/lib/status";
import { PRICE_MONTHLY, PRICE_YEARLY, QRIS_NAME, PAY_METHODS } from "@/lib/plans";

const NAMA: Record<string, string> = { monthly: "Bulanan", yearly: "Tahunan", trial: "Percobaan" };
const STAT: Record<string, string> = { paid: "Lunas", rejected: "Ditolak", cancelled: "Dibatalkan" };

function Content() {
  const me = useMe();
  const isOwner = me.role === "owner";
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrisOk, setQrisOk] = useState(true);
  const [choose, setChoose] = useState<"monthly" | "yearly" | null>(null);

  const load = () => api("/api/subscription").then((r) => { setD(r); setErr(""); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const act = async (body: any, ok: string) => {
    if (busy) return;
    setBusy(true); setErr(""); setMsg("");
    try { await api("/api/subscription", { method: "POST", body }); setMsg(ok); setNote(""); setChoose(null); }
    catch (e: any) { setErr(e.message); }
    await load();
    setBusy(false);
  };

  const bayarOnline = async (plan: "monthly" | "yearly") => {
    if (busy) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await api("/api/subscription", { method: "POST", body: { action: "checkout", plan } });
      if (!r.redirect_url) throw new Error("Tautan pembayaran tidak tersedia");
      window.location.href = r.redirect_url;
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  if (!d) return <p className={err ? "err" : "text-slate-500"}>{err || "Memuat…"}</p>;
  const s = d.state;
  const p = d.pending;
  const pm = p ? PAY_METHODS.find((m) => m.id === (p.method || "qris")) : null;
  const hemat = PRICE_MONTHLY * 12 - PRICE_YEARLY;
  const chosenPrice = choose === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY;
  const g = !!(d.gateway?.enabled && !d.demo); // pembayaran online aktif untuk toko ini

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Langganan</h1>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}

      <div className="card">
        {s.type === "expired" && <p className="err"><b>Langganan berakhir</b> pada {fmtDate(s.until)}. Perpanjang agar sistem bisa dipakai kembali.</p>}
        {s.type === "trial" && <p className="ok"><b>Masa percobaan</b> sampai {fmtDate(s.until)} (sisa {s.days} hari).</p>}
        {s.type === "paid" && <p className="ok"><b>Paket {NAMA[s.plan] || ""} aktif</b> sampai {fmtDate(s.until)} (sisa {s.days} hari).</p>}
        <p className="mt-2 text-xs text-slate-500">Halaman pelacakan untuk pelanggan toko tetap bisa dibuka walau langganan berakhir.</p>
      </div>

      {!isOwner && <p className="text-slate-600">Hanya pemilik toko yang dapat mengelola langganan. Hubungi pemilik toko.</p>}

      {isOwner && !g && choose && (
        <div className="card border-2 border-brand">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Pilih metode pembayaran</h2>
              <p className="text-sm text-slate-600">Paket {NAMA[choose]}: {rupiah(chosenPrice)} (ditambah kode unik)</p>
            </div>
            <button className="btn-ghost" onClick={() => setChoose(null)}>Batal</button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {PAY_METHODS.map((m) => (
              <button key={m.id} disabled={busy}
                onClick={() => act({ action: "order", plan: choose, method: m.id }, "Tagihan dibuat. Ikuti petunjuk pembayaran di bawah.")}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand disabled:opacity-50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: m.color }}>{m.name[0]}</span>
                <span>
                  <span className="block font-semibold">{m.name}</span>
                  <span className="block text-xs text-slate-500">{m.kind === "qris" ? m.hint : "Transfer ke nomor e-wallet"}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOwner && p && pm && !g && (
        <div className="card border-brand">
          <h2 className="mb-1 font-semibold">Tagihan {NAMA[p.plan]} via {pm.name}: menunggu pembayaran</h2>
          <p className="text-sm">Bayar dengan nominal <b>tepat</b>:</p>
          <p className="my-1 text-3xl font-extrabold">{rupiah(p.amount)}</p>
          <p className="text-xs text-slate-500">Sudah termasuk kode unik {p.unique_code} agar pembayaran mudah dikenali. Jangan dibulatkan.</p>

          {pm.kind === "ewallet" ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Kirim ke {pm.name}:</p>
              <p className="text-2xl font-bold tracking-wide">{pm.number}</p>
              <p className="text-sm text-slate-600">a.n. {pm.holder}</p>
              <button className="btn-ghost mt-2" onClick={() => { navigator.clipboard.writeText(pm.number || ""); setMsg("Nomor disalin"); }}>Salin nomor</button>
            </div>
          ) : qrisOk ? (
            <div className="mt-3">
              <img src="/qris.png" alt="QRIS" className="max-w-[240px] rounded-xl border border-slate-200 p-2" onError={() => setQrisOk(false)} />
              <p className="mt-2 text-sm text-slate-600">a.n. {QRIS_NAME}</p>
            </div>
          ) : (
            <p className="err mt-3">Gambar QRIS belum dipasang. Simpan gambar QRIS sebagai <b>public/qris.png</b> lalu deploy ulang.</p>
          )}

          {p.claimed ? (
            <p className="ok mt-3">Konfirmasi terkirim. Menunggu verifikasi (maksimal 1x24 jam).</p>
          ) : (
            <div className="mt-3">
              <label className="label">Catatan pembayaran (nama pengirim / jam bayar)</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn-primary mt-3" disabled={busy} onClick={() => act({ action: "claim", id: p.id, note }, "Terima kasih. Pembayaran sedang diverifikasi.")}>
                Saya sudah bayar
              </button>
            </div>
          )}
        </div>
      )}

      {isOwner && g && p && (
        <div className="card border-brand">
          <h2 className="mb-1 font-semibold">Menunggu pembayaran online</h2>
          <p className="text-sm">Tagihan {NAMA[p.plan]} sebesar <b>{rupiah(p.amount)}</b> belum lunas.</p>
          <p className="mt-1 text-xs text-slate-500">Selesaikan pembayaran di halaman Midtrans. Status berubah otomatis setelah pembayaran berhasil — tidak perlu konfirmasi manual.</p>
          <button className="btn-primary mt-3" disabled={busy} onClick={() => bayarOnline(p.plan)}>Lanjutkan pembayaran</button>
        </div>
      )}

      {isOwner && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h2 className="font-semibold">Bulanan</h2>
            <p className="my-2 text-3xl font-extrabold">{rupiah(PRICE_MONTHLY)}<span className="text-sm font-normal text-slate-500"> / bulan</span></p>
            <p className="mb-3 text-sm text-slate-600">Fleksibel, bayar tiap bulan.</p>
            <button className="btn-ghost" disabled={busy} onClick={() => (g ? bayarOnline("monthly") : setChoose("monthly"))}>{g ? "Bayar online" : "Pilih bulanan"}</button>
          </div>
          <div className="card border-2 border-brand">
            <h2 className="font-semibold">Tahunan <span className="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-dark">Hemat {rupiah(hemat)}</span></h2>
            <p className="my-2 text-3xl font-extrabold">{rupiah(PRICE_YEARLY)}<span className="text-sm font-normal text-slate-500"> / tahun</span></p>
            <p className="mb-3 text-sm text-slate-600">Lebih hemat dibanding bayar bulanan.</p>
            <button className="btn-primary" disabled={busy} onClick={() => (g ? bayarOnline("yearly") : setChoose("yearly"))}>{g ? "Bayar online" : "Pilih tahunan"}</button>
          </div>
        </div>
      )}

      {isOwner && d.history.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="mb-2 font-semibold">Riwayat tagihan</h2>
          <table className="w-full">
            <thead><tr><th className="th">Tanggal</th><th className="th">Paket</th><th className="th">Metode</th><th className="th">Nominal</th><th className="th">Status</th></tr></thead>
            <tbody>
              {d.history.map((h: any) => (
                <tr key={h.id} className="border-t border-slate-100">
                  <td className="td">{fmtDate(h.created_at)}</td>
                  <td className="td">{NAMA[h.plan]}</td>
                  <td className="td">{(h.method || "qris").toUpperCase()}</td>
                  <td className="td">{rupiah(h.amount)}</td>
                  <td className="td">{h.status === "pending" ? (h.claimed ? "Diverifikasi" : "Menunggu bayar") : STAT[h.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <StaffShell roles={["cashier", "technician"]}><Content /></StaffShell>;
}
