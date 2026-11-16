"use client";
import StaffShell from "@/components/StaffShell";
import ReportView from "@/components/ReportView";

export default function Page() {
  return (
    <StaffShell roles={["owner"]}>
      <ReportView title="Laporan keuangan servis" endpoint="/api/reports/owner" base="laporan-servis" />
    </StaffShell>
  );
}
