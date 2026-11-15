"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";
import { api } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
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
    </main>
  );
}
