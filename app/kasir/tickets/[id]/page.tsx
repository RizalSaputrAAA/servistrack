"use client";
import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import StaffShell from "@/components/StaffShell";
import TicketDetail from "@/components/TicketDetail";

function Inner() {
  const { id } = useParams() as { id: string };
  const isNew = useSearchParams().get("new") === "1";
  return <TicketDetail id={id} justCreated={isNew} />;
}

export default function KasirTicket() {
  return (
    <StaffShell roles={["cashier"]}>
      <Suspense fallback={<p>Memuat…</p>}>
        <Inner />
      </Suspense>
    </StaffShell>
  );
}
