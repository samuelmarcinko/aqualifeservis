import { prisma } from "@/lib/db";
import { customerDisplayName } from "@/lib/snapshots";

export async function getCustomerOptions() {
  const customers = await prisma.customer.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      serviceAddresses: { where: { archivedAt: null }, orderBy: { label: "asc" } },
    },
  });
  return customers.map((c) => ({
    id: c.id,
    name: customerDisplayName(c),
    addresses: c.serviceAddresses.map((a) => ({ id: a.id, label: a.label })),
  }));
}
