import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { RentalSubnav } from "./rental-subnav";
import { ReservationsList } from "./reservations-list";

export const dynamic = "force-dynamic";

export default async function RentalReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const status = sp.status ?? "";

  const [reservations, pending] = await Promise.all([
    prisma.rentalReservation.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { tool: { select: { name: true } } },
    }),
    prisma.rentalReservation.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div>
      <PageHeader title="Požičovňa" subtitle="Rezervácie náradia" />
      <RentalSubnav pending={pending} />
      <ReservationsList
        currentStatus={status}
        reservations={reservations.map((r) => ({
          id: r.id,
          number: r.number,
          toolName: r.tool.name,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          customerPhone: r.customerPhone,
          customerCompany: r.customerCompany,
          customerNote: r.customerNote,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          days: r.days,
          deliveryType: r.deliveryType,
          deliveryKm: r.deliveryKm,
          deliveryAddress: r.deliveryAddress,
          rentalExVat: r.rentalExVat.toString(),
          deliveryExVat: r.deliveryExVat.toString(),
          priceInclVat: r.priceInclVat.toString(),
          adminNote: r.adminNote,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
