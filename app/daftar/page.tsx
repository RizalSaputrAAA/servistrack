"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Daftar() {
  const [f, setF] = useState({ shop_name: "", address: "", phone: "", owner_name: "", email: "", password: "", password2: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr("");
    if (f.password !== f.password2) return setErr("Konfirmasi password tidak sama");
    setBusy(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Pendaftaran gagal");
      router.replace("/login?daftar=1");
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-brand">Daftar toko baru</h1>
      <p className="mb-6 text-sm text-slate-500">Gratis 3 hari. Tanpa kartu kredit.</p>
      <form onSubmit={submit} className="card space-y-3">
        {err && <p className="err">{err}</p>}
        <div>
          <label className="label" htmlFor="shop">Nama toko</label>
          <input id="shop" className="input" required value={f.shop_name} onChange={set("shop_name")} />
        </div>
        <div>
          <label className="label" htmlFor="addr">Alamat (opsional)</label>
          <input id="addr" className="input" value={f.address} onChange={set("address")} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Nomor WhatsApp (opsional)</label>
          <input id="phone" className="input" value={f.phone} onChange={set("phone")} placeholder="08…" />
        </div>
        <hr className="border-slate-200" />
        <div>
          <label className="label" htmlFor="owner">Nama pemilik</label>
          <input id="owner" className="input" required value={f.owner_name} onChange={set("owner_name")} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required value={f.email} onChange={set("email")} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Password (min. 8 karakter)</label>
          <input id="pw" className="input" type="password" required value={f.password} onChange={set("password")} />
        </div>
        <div>
          <label className="label" htmlFor="pw2">Ulangi password</label>
          <input id="pw2" className="input" type="password" required value={f.password2} onChange={set("password2")} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Mendaftar…" : "Daftar"}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        Sudah punya akun? <Link className="underline" href="/login">Masuk</Link>
      </p>
    </main>
  );
}
