"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StaffShell from "@/components/StaffShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { DIAGNOSIS_LABEL } from "@/lib/status";
import { SYMPTOMS } from "@/lib/triage";

function Queue() {
  const [tab, setTab] = useState<"mine" | "all">("all");
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");

  const load = () =>
    api(`/api/tickets?scope=${tab}`).then((r) => setRows(r.tickets)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [tab]);

  const claim = async (id: string) => {
    setErr("");
    try { await api(`/api/tickets/${id}/claim`, { method: "POST" }); await load(); }
    catch (e: any) { setErr(e.message); }
  };
  const symLabel = (c: string) => SYMPTOMS.find((s) => s.code === c)?.label || c;

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Antrean prioritas</h1>
      <div className="mb-4 flex gap-2">
        <button className={tab === "mine" ? "btn-primary" : "btn-ghost"} onClick={() => setTab("mine")}>Ditugaskan ke saya</button>
        <button className={tab === "all" ? "btn-primary" : "btn-ghost"} onClick={() => setTab("all")}>Semua antrean</button>
      </div>
      {err && <p className="err mb-3">{err}</p>}
      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-slate-200">
            <tr><th className="th">Kode</th><th className="th">Gejala utama</th><th className="th">Dugaan</th><th className="th">Skor</th><th className="th">Status</th><th className="th"></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="td font-medium">{r.ticket_code}</td>
                <td className="td">{symLabel(r.symptoms[0])}{r.symptoms.length > 1 ? ` +${r.symptoms.length - 1}` : ""}</td>
                <td className="td">{DIAGNOSIS_LABEL[r.triage_diagnosis] || "-"}</td>
                <td className="td font-semibold">{r.triage_score}</td>
                <td className="td"><StatusBadge status={r.status} /></td>
                <td className="td space-x-2 whitespace-nowrap">
                  {!r.assigned_to && <button className="btn-primary" onClick={() => claim(r.id)}>Klaim</button>}
                  <Link className="btn-ghost" href={`/teknisi/tickets/${r.id}`}>Detail</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-500" colSpan={6}>Belum ada tiket di antrean ini.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Page() {
  return <StaffShell roles={["technician"]}><Queue /></StaffShell>;
}
