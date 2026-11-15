"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StaffShell, { useMe } from "@/components/StaffShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { STATUS, fmtDate } from "@/lib/status";
import { SYMPTOMS } from "@/lib/triage";

const PAGE_SIZE = 20;
const symLabel = (c: string) => SYMPTOMS.find((s) => s.code === c)?.label || c;

function List() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const me = useMe();
  const canDelete = ["owner", "cashier"].includes(me?.role);
  const [busyId, setBusyId] = useState("");

  const hapus = async (row: any) => {
    const yakin = confirm(`Hapus tiket ${row.ticket_code} - ${row.customer_name}?` + "\n" + "Event, pembayaran, dan pemakaian sparepart ikut terhapus. Tidak bisa dibatalkan.");
    if (!yakin) return;
    setBusyId(row.id); setErr("");
    try {
      await api(`/api/tickets/${row.id}`, { method: "DELETE" });
      setRows((x) => x.filter((y) => y.id !== row.id));
    } catch (e: any) { setErr(e.message); }
    setBusyId("");
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    api(`/api/tickets?status=${status}`)
      .then((r) => { setRows(r.tickets); setErr(""); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const key = q.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      !key ||
      r.ticket_code.toLowerCase().includes(key) ||
      r.customer_name.toLowerCase().includes(key) ||
      (r.customer_phone || "").includes(key)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Daftar tiket</h1>
        <Link href="/kasir/tickets/new" className="btn-primary">Tiket baru</Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="Cari kode, nama, atau nomor HP"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tiket aktif (belum diambil)</option>
          <option value="all">Semua tiket</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {err && <p className="err mb-3">{err}</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="th">Kode</th>
              <th className="th">Pelanggan</th>
              <th className="th">Laptop</th>
              <th className="th">Gejala utama</th>
              <th className="th">Skor</th>
              <th className="th">Status</th>
              <th className="th">Teknisi</th>
              <th className="th">Masuk</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="td font-medium">{r.ticket_code}</td>
                <td className="td">{r.customer_name}</td>
                <td className="td">{r.device_brand} {r.device_type}</td>
                <td className="td">
                  {symLabel(r.symptoms[0])}{r.symptoms.length > 1 ? ` +${r.symptoms.length - 1}` : ""}
                </td>
                <td className="td font-semibold">{r.triage_score}</td>
                <td className="td"><StatusBadge status={r.status} /></td>
                <td className="td text-slate-500">{r.assigned_to ? "Sudah" : "Belum"}</td>
                <td className="td whitespace-nowrap text-slate-500">{fmtDate(r.created_at)}</td>
                <td className="td">
                  <div className="flex gap-2">
                    <Link className="btn-ghost" href={`/kasir/tickets/${r.id}`}>Detail</Link>
                    {canDelete && (
                      <button className="btn-danger whitespace-nowrap" disabled={busyId === r.id} onClick={() => hapus(r)}>
                        {busyId === r.id ? "…" : "Hapus"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && shown.length === 0 && (
              <tr>
                <td className="td text-slate-500" colSpan={9}>
                  Tidak ada tiket yang cocok. Ubah kata kunci atau filter status.
                </td>
              </tr>
            )}
            {loading && (
              <tr><td className="td text-slate-500" colSpan={9}>Memuat…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">{filtered.length} tiket</span>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
          <span>Halaman {page} dari {pages}</span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Berikutnya</button>
        </div>
      </div>
    </>
  );
}

export default function KasirTickets() {
  return (
    <StaffShell roles={["cashier"]}>
      <List />
    </StaffShell>
  );
}
