import { STATUS } from "@/lib/status";

export default function StatusBadge({ status, big = false }: { status: string; big?: boolean }) {
  const s = STATUS[status] || STATUS.received;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-semibold ${s.cls} ${big ? "px-5 py-2 text-lg" : "px-3 py-1 text-xs"}`}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}
