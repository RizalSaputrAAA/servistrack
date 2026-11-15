"use client";
import PasswordInput from "@/components/PasswordInput";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

// Halaman tujuan tautan reset dari email (Supabase membuat sesi sementara dari tautan itu).
export default function AturSandi() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabase();
    supa.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supa.auth.onAuthStateChange((_e, session) => setHasSession(!!session));
    setReady(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (pw.length < 8) return setErr("Sandi minimal 8 karakter");
    if (pw !== pw2) return setErr("Konfirmasi sandi tidak sama");
    setBusy(true);
    const { error } = await getSupabase().auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setBusy(false); return; }
    await getSupabase().auth.signOut();
    router.replace("/login?reset=1");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-brand">Atur sandi baru</h1>
      <p className="mb-6 text-sm text-slate-500">Masukkan sandi baru untuk akun Anda.</p>
      <form onSubmit={submit} className="card space-y-3">
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="err">{err}</p>}
        {ready && !hasSession && (
          <p className="err">Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru di halaman Lupa sandi.</p>
        )}
        <div>
          <label className="label" htmlFor="pw">Sandi baru (min. 8)</label>
          <PasswordInput id="pw" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw2">Ulangi sandi baru</label>
          <PasswordInput id="pw2" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={busy || !hasSession}>{busy ? "Menyimpan…" : "Simpan sandi baru"}</button>
      </form>
    </main>
  );
}
