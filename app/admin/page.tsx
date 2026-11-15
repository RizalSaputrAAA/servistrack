"use client";
import { useEffect, useState } from "react";
import { rupiah, fmtDate } from "@/lib/status";
import { getSupabase } from "@/lib/supabase-browser";

const NAMA: Record<string, string> = { monthly: "Bulanan", yearly: "Tahunan", trial: "Percobaan" };

// Halaman PEMILIK PLATFORM (Anda). Bisa dibuka dengan ADMIN_PASSWORD (env Vercel),
// atau langsung bila sudah login sebagai pemilik toko (role owner).
export default function Admin() {
  const [pw, setPw] = useState("");
  const [token, setToken] = useState("");
  const [checked, setChecked] = useState(false);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [rstEmail, setRstEmail] = useState("");
  const [rstPw, setRstPw] = useState("");

  const call = async (method: string, body?: any, tok?: string) => {
    const bearer = tok || token;
    const r = await fetch("/api/admin", {
      method, cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(pw ? { "x-admin-password": pw } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Gagal");
    return j;
  };
  const load = async () => {
    try { setD(await call("GET")); setErr(""); } catch (e: any) { setErr(e.message); setD(null); }
  };

  // Sudah login sebagai owner? Buka admin tanpa perlu mengetik password.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const t = data.session?.access_token;
        if (t) {
          setToken(t);
          setD(await call("GET", undefined, t));
          setErr("");
        }
      } catch { /* jatuh ke form password */ }
      setChecked(true);
    })();
  }, []);
  const act = async (body: any, ok: string) => {
    if (busy) return;
    setBusy(true); setMsg(""); setErr("");
    try { await call("POST", body); setMsg(ok); } catch (e: any) { setErr(e.message); }
    await load();
    setBusy(false);
  };

  if (!d && !checked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <p className="text-slate-500">Memeriksa sesi…</p>
      </main>
    );
  }

  if (!d) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <h1 className="mb-4 text-2xl font-bold text-brand">Admin langganan</h1>
        <div className="card space-y-3">
          {err && <p className="err">{err}</p>}
          <label className="label" htmlFor="pw">Password admin</label>
          <input id="pw" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn-primary w-full" onClick={load}>Masuk</button>
          <p className="text-xs text-slate-500">
            Sudah login sebagai pemilik toko? Admin terbuka otomatis tanpa password.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Admin langganan</h1>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}

      <div className="card">
        <h2 className="mb-2 font-semibold">Tagihan menunggu verifikasi</h2>
        {d.invoices.length === 0 && <p className="text-sm text-slate-500">Tidak ada tagihan.</p>}
        {d.invoices.map((i: any) => (
          <div key={i.id} className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div className="text-sm">
              <b>{i.shops?.name}</b>: {NAMA[i.plan]} via <b>{(i.method || "qris").toUpperCase()}</b> — <b>{rupiah(i.amount)}</b>
              <br />
              <span className="text-xs text-slate-500">
                {fmtDate(i.created_at)} · {i.claimed ? `Klaim sudah bayar: ${i.claim_note}` : "Belum klaim bayar"}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={busy} onClick={() => act({ action: "approve", id: i.id }, "Disetujui, langganan diperpanjang")}>Setujui</button>
              <button className="btn-danger" disabled={busy} onClick={() => act({ action: "reject", id: i.id }, "Tagihan ditolak")}>Tolak</button>
            </div>
          </div>
        ))}
        <p className="mt-2 text-xs text-slate-500">Cocokkan nominal (termasuk kode unik) dengan mutasi QRIS/rekening Anda sebelum menyetujui.</p>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Daftar toko</h2>
        {d.shops.map((s: any) => (
          <div key={s.id} className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div className="text-sm">
              <b>{s.name}</b>
              <br />
              <span className="text-xs text-slate-500">
                {s.state.type === "expired" ? "Habis" : s.state.type === "paid" ? `Berbayar (${NAMA[s.state.plan] || ""})` : "Percobaan"} · sampai {fmtDate(s.state.until)} · sisa {s.state.days} hari
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost" disabled={busy} onClick={() => act({ action: "manual", shop_id: s.id, plan: "monthly" }, "Diperpanjang 1 bulan")}>+1 bulan</button>
              <button className="btn-ghost" disabled={busy} onClick={() => act({ action: "manual", shop_id: s.id, plan: "yearly" }, "Diperpanjang 1 tahun")}>+1 tahun</button>
              <button className="btn-ghost" disabled={busy} onClick={() => { if (confirm("Ulang masa percobaan dan hapus masa berbayar?")) act({ action: "reset_trial", shop_id: s.id }, "Masa percobaan diulang"); }}>Reset trial</button>
            </div>
          </div>
        ))}
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Reset sandi staf</h2>
        <p className="text-xs text-slate-500">Cadangan bila email reset tidak sampai. Minimal 8 karakter.</p>
        <input className="input" placeholder="email staf" value={rstEmail} onChange={(e) => setRstEmail(e.target.value)} />
        <input className="input" placeholder="sandi baru" value={rstPw} onChange={(e) => setRstPw(e.target.value)} />
        <button className="btn-primary" disabled={busy}
          onClick={() => { act({ action: "reset_user_password", email: rstEmail, password: rstPw }, "Sandi staf berhasil direset"); setRstPw(""); }}>
          Reset sandi
        </button>
      </div>
    </main>
  );
}
