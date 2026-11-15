"use client";
import PasswordInput from "@/components/PasswordInput";
import { useEffect, useState } from "react";
import StaffShell from "@/components/StaffShell";
import { api } from "@/lib/api";

const PERAN: Record<string, string> = { owner: "Pemilik", cashier: "Kasir", technician: "Teknisi" };

function Content() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "cashier", whatsapp: "" });
  const [resetId, setResetId] = useState("");
  const [waId, setWaId] = useState("");
  const [waVal, setWaVal] = useState("");
  const [resetPw, setResetPw] = useState("");
  const [toko, setToko] = useState<any>(null);

  const load = () =>
    api("/api/staff").then((r) => { setRows(r.staff); setErr(""); }).catch((e) => setErr(e.message));

  useEffect(() => { load(); api("/api/shop").then((x) => setToko(x.shop)).catch(() => {}); }, []);

  const act = async (body: any, ok: string) => {
    if (busy) return;
    setBusy(true); setErr(""); setMsg("");
    try { await api("/api/staff", { method: "POST", body }); setMsg(ok); }
    catch (e: any) { setErr(e.message); }
    await load();
    setBusy(false);
  };

  const simpanToko = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(""); setMsg("");
    try { await api("/api/shop", { method: "PATCH", body: { name: toko?.name, phone: toko?.phone, address: toko?.address } }); setMsg("Data toko disimpan"); }
    catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    await act({ action: "add", ...form }, "Staf ditambahkan. Beri tahu sandi awalnya.");
    setForm({ full_name: "", email: "", password: "", role: "cashier", whatsapp: "" });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Staf toko</h1>
        <p className="mt-1 text-sm text-slate-500">Tambahkan kasir dan teknisi. Hanya pemilik toko yang bisa mengelola.</p>
      </div>

      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}

      <form onSubmit={simpanToko} className="card space-y-3">
        <h2 className="font-semibold">Data toko & WhatsApp</h2>
        <p className="text-xs text-slate-500">Nomor ini yang dipakai pelanggan untuk menghubungi toko saat melacak tiket. Isi nomor WhatsApp toko, bukan nomor pribadi yang tidak dipakai.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sn">Nama toko</label>
            <input id="sn" className="input" value={toko?.name || ""} onChange={(e) => setToko({ ...toko, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="sp">Nomor WhatsApp toko</label>
            <input id="sp" className="input" value={toko?.phone || ""} onChange={(e) => setToko({ ...toko, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="sa">Alamat</label>
            <input id="sa" className="input" value={toko?.address || ""} onChange={(e) => setToko({ ...toko, address: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary" disabled={busy}>Simpan data toko</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Nama</th>
              <th className="th">Email</th>
              <th className="th">Peran</th>
              <th className="th">Status</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="td font-medium">{s.full_name}</td>
                <td className="td">{s.email || "-"}</td>
                <td className="td">{PERAN[s.role] || s.role}<br /><span className="text-xs text-slate-500">{s.whatsapp || "WA belum diisi"}</span></td>
                <td className="td">{s.active ? "Aktif" : <span className="text-red-600">Nonaktif</span>}</td>
                <td className="td">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-ghost" disabled={busy}
                      onClick={() => act({ action: "set_active", id: s.id, active: !s.active }, s.active ? "Staf dinonaktifkan" : "Staf diaktifkan")}>
                      {s.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button className="btn-ghost" onClick={() => { setWaId(waId === s.id ? "" : s.id); setWaVal(s.whatsapp || ""); }}>
                      {s.whatsapp ? "Ubah WA" : "Isi WA"}
                    </button>
                    <button className="btn-ghost" onClick={() => { setResetId(resetId === s.id ? "" : s.id); setResetPw(""); }}>
                      Reset sandi
                    </button>
                  </div>
                  {waId === s.id && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input className="input" placeholder="08xxxxxxxxxx" value={waVal} onChange={(e) => setWaVal(e.target.value)} />
                      <button className="btn-primary" disabled={busy}
                        onClick={async () => { await act({ action: "set_whatsapp", id: s.id, whatsapp: waVal }, "Nomor WhatsApp disimpan"); setWaId(""); setWaVal(""); }}>
                        Simpan
                      </button>
                    </div>
                  )}
                  {resetId === s.id && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <PasswordInput placeholder="sandi baru (min. 8)" value={resetPw} onChange={(e) => setResetPw(e.target.value)} />
                      <button className="btn-primary" disabled={busy}
                        onClick={async () => { await act({ action: "reset_password", id: s.id, password: resetPw }, "Sandi staf direset"); setResetId(""); setResetPw(""); }}>
                        Simpan
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-500" colSpan={5}>Belum ada staf.</td></tr>}
          </tbody>
        </table>
      </div>

      <form onSubmit={tambah} className="card space-y-3">
        <h2 className="font-semibold">Tambah staf</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nm">Nama lengkap</label>
            <input id="nm" className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="em">Email</label>
            <input id="em" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="pw">Sandi awal (min. 8)</label>
            <PasswordInput id="pw" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="wa">Nomor WhatsApp staf</label>
            <input id="wa" className="input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="08xxxxxxxxxx (dipakai pelanggan)" />
          </div>
          <div>
            <label className="label" htmlFor="rl">Peran</label>
            <select id="rl" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="cashier">Kasir</option>
              <option value="technician">Teknisi</option>
              <option value="owner">Pemilik</option>
            </select>
          </div>
        </div>
        <button className="btn-primary" disabled={busy}>Tambah staf</button>
        <p className="text-xs text-slate-500">
          Staf bisa mengganti sandinya sendiri lewat menu “Ganti sandi” setelah masuk.
        </p>
      </form>
    </div>
  );
}

export default function Page() {
  return <StaffShell roles={["cashier", "technician"]}><Content /></StaffShell>;
}
