export const STATUS: Record<string, { label: string; icon: string; cls: string }> = {
  received: { label: "Diterima", icon: "📥", cls: "bg-slate-100 text-slate-700" },
  diagnosing: { label: "Diagnosa", icon: "🔍", cls: "bg-sky-100 text-sky-800" },
  waiting_approval: { label: "Menunggu Persetujuan", icon: "⏳", cls: "bg-amber-100 text-amber-800" },
  in_progress: { label: "Dikerjakan", icon: "🔧", cls: "bg-indigo-100 text-indigo-800" },
  done: { label: "Selesai", icon: "✅", cls: "bg-emerald-100 text-emerald-800" },
  picked_up: { label: "Sudah Diambil", icon: "📦", cls: "bg-teal-100 text-teal-800" },
  cancelled: { label: "Dibatalkan", icon: "✖️", cls: "bg-red-100 text-red-800" },
};

// State machine: hanya boleh ke status berikutnya
export const NEXT: Record<string, string[]> = {
  received: ["diagnosing"],
  diagnosing: ["waiting_approval"],
  waiting_approval: ["in_progress", "cancelled"],
  in_progress: ["done"],
  done: ["picked_up"],
};

export const DIAGNOSIS_LABEL: Record<string, string> = {
  power_charging: "Daya / charging",
  display: "Layar / display",
  motherboard: "Motherboard",
  storage_os: "Penyimpanan / sistem operasi",
  keyboard: "Keyboard / touchpad",
  overheating: "Overheat / pendinginan",
  liquid_damage: "Kena cairan",
  network: "Jaringan / WiFi",
  battery: "Baterai",
  software: "Software",
};

export const rupiah = (n: any) => (n == null ? "-" : "Rp " + Number(n).toLocaleString("id-ID"));
export const fmtDate = (s: string | null) =>
  !s ? "-" : new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
