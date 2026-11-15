"use client";
import { useParams } from "next/navigation";
import StaffShell from "@/components/StaffShell";
import TicketDetail from "@/components/TicketDetail";

export default function TeknisiTicket() {
  const { id } = useParams() as { id: string };
  return (
    <StaffShell roles={["technician"]}>
      <TicketDetail id={id} />
    </StaffShell>
  );
}
