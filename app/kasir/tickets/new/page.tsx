"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import StaffShell from "@/components/StaffShell";
import { api } from "@/lib/api";
import { SYMPTOMS } from "@/lib/triage";

const BRANDS = ["Asus", "Acer", "Lenovo", "HP", "Dell", "Apple", "Toshiba", "MSI", "Lainnya"];

export default function NewTicket() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", brand: "Asus", type: "", notes: "" });
  const [sym, setSym] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (c: string) => setSym((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (sym.length === 0) return setErr("Pilih minimal 1 gejala");
    setBusy(true);
    try {
      const r = await api("/api/tickets", { method: "POST", body: { ...f, symptoms: sym } });
      router.push(`/kasir/tickets/${r.id}?new=1`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <StaffShell roles={["cashier"]}>
      <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">Tiket baru</h1>
      <form onSubmit={submit} className="card space-y-5 p-6">
        {err && <p className="err">{err}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nama pelanggan</label>
            <input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Nomor HP</label>
            <input className="input" required placeholder="08xxxxxxxxxx" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Merek laptop</label>
            <select className="input" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}>
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipe / model</label>
            <input className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
          </div>
        </div>

        <fieldset>
          <legend className="label">Gejala (pilih minimal 1)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SYMPTOMS.map((s) => (
              <label key={s.code} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input type="checkbox" checked={sym.includes(s.code)} onChange={() => toggle(s.code)} />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label">Catatan tambahan</label>
          <textarea className="input" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </div>
        <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "Membuat…" : "Buat tiket"}</button>
      </form>
      </div>
    </StaffShell>
  );
}
