"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-browser";

export default function LupaSandi() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(""); setMsg("");
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/atur-sandi`,
    });
    if (error) setErr(error.message);
    else setMsg("Kalau email itu terdaftar, kami sudah mengirim tautan reset. Periksa kotak masuk dan folder spam.");
    setBusy(false);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-brand">Lupa sandi</h1>
      <p className="mb-6 text-sm text-slate-500">Masukkan email akun Anda, kami kirim tautan untuk membuat sandi baru.</p>
      <form onSubmit={submit} className="card space-y-3">
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="err">{err}</p>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Mengirim…" : "Kirim tautan reset"}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link className="underline" href="/login">Kembali ke halaman masuk</Link>
      </p>
    </main>
  );
}
