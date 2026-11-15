"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";
import { api } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("daftar")) setNote("Akun berhasil dibuat. Silakan masuk.");
    if (q.get("reset")) setNote("Sandi diperbarui. Silakan masuk kembali.");
  }, []);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) { setErr("Email atau password salah"); setBusy(false); return; }
    try {
      const me = await api("/api/me");
      router.replace(me.role === "technician" ? "/teknisi/tickets" : "/kasir/tickets/new");
    } catch {
      setErr("Akun ini belum terdaftar sebagai staf toko"); setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-brand">ServisTrack</h1>
      <p className="mb-6 text-sm text-slate-500">Masuk khusus staf toko</p>
      <form onSubmit={submit} className="card space-y-3">
        {note && <p className="ok">{note}</p>}
        {err && <p className="err">{err}</p>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Masuk…" : "Masuk"}</button>
      </form>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        <Link className="underline" href="/lupa-sandi">Lupa sandi?</Link>
        <Link className="underline" href="/daftar">Daftar toko baru</Link>
        <Link className="underline" href="/demo">Akun demo</Link>
      </div>
    </main>
  );
}
