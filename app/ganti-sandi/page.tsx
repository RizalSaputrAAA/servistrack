"use client";
import PasswordInput from "@/components/PasswordInput";
import { useEffect, useState } from "react";
import StaffShell from "@/components/StaffShell";
import { getSupabase } from "@/lib/supabase-browser";

// Dipakai staf toko sungguhan: ganti sandi sendiri setelah login.
// Sandi lama diminta dulu supaya sesi yang tertinggal di komputer lain tidak bisa dipakai.
function Content() {
  const [email, setEmail] = useState("");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => setEmail(data.session?.user.email || ""));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(""); setMsg("");
    if (!email) return setErr("Sesi tidak ditemukan, silakan masuk ulang");
    if (!cur) return setErr("Masukkan sandi saat ini");
    if (pw.length < 8) return setErr("Sandi baru minimal 8 karakter");
    if (pw === cur) return setErr("Sandi baru harus berbeda dari sandi lama");
    if (pw !== pw2) return setErr("Konfirmasi sandi tidak sama");

    setBusy(true);
    const supa = getSupabase();
    const { error: authErr } = await supa.auth.signInWithPassword({ email, password: cur });
    if (authErr) { setErr("Sandi saat ini salah"); setBusy(false); return; }
    const { error } = await supa.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setBusy(false); return; }
    setMsg("Sandi berhasil diperbarui. Gunakan sandi baru pada login berikutnya.");
    setCur(""); setPw(""); setPw2("");
    setBusy(false);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ganti sandi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Akun: <b>{email || "…"}</b>
        </p>
      </div>
      <form onSubmit={submit} className="card space-y-3">
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="err">{err}</p>}
        <div>
          <label className="label" htmlFor="cur">Sandi saat ini</label>
          <PasswordInput id="cur" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </div>
        <div>
          <label className="label" htmlFor="pw">Sandi baru (min. 8 karakter)</label>
          <PasswordInput id="pw" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="pw2">Ulangi sandi baru</label>
          <PasswordInput id="pw2" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Menyimpan…" : "Simpan sandi baru"}</button>
        <p className="text-xs text-slate-500">
          Lupa sandi saat ini? Minta pemilik toko mereset lewat /admin, atau gunakan halaman Lupa sandi.
        </p>
      </form>
    </div>
  );
}

export default function Page() {
  return <StaffShell roles={["cashier", "technician"]}><Content /></StaffShell>;
}
