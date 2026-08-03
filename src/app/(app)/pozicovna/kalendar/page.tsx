import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { toDayISO } from "@/lib/services/rental-core";
import { RentalSubnav } from "../rental-subnav";
import { RentalCalendar } from "./rental-calendar";

export const dynamic = "force-dynamic";

export default async function RentalCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const tools = await prisma.rentalTool.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, quantity: true },
  });
  const toolId = sp.tool || tools[0]?.id || "";

  const bookings = toolId
    ? await prisma.rentalBooking.findMany({
        where: { toolId },
        orderBy: { startDate: "asc" },
        include: { reservation: { select: { number: true, customerName: true } } },
      })
    : [];

  return (
    <div>
      <PageHeader title="Požičovňa" subtitle="Kalendár dostupnosti a manuálne blokovanie" />
      <RentalSubnav />
      <RentalCalendar
        tools={tools}
        selectedToolId={toolId}
        bookings={bookings.map((b) => ({
          id: b.id,
          startISO: toDayISO(b.startDate),
          endISO: toDayISO(b.endDate),
          type: b.type,
          note: b.note,
          reservationNumber: b.reservation?.number ?? null,
          customerName: b.reservation?.customerName ?? null,
        }))}
      />
    </div>
  );
}
