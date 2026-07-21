import { prisma } from "@/lib/db";
import { customerDisplayName } from "@/lib/snapshots";

export interface CustomerAddressOption {
  id: string;
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  objectType: string | null;
  apartment: string | null;
}

export interface CustomerOption {
  id: string;
  name: string;
  addresses: CustomerAddressOption[];
}

export async function getCustomerOptions(): Promise<CustomerOption[]> {
  const customers = await prisma.customer.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      serviceAddresses: {
        where: { archivedAt: null },
        orderBy: [{ isDefault: "desc" }, { label: "asc" }],
      },
    },
  });
  return customers.map((c) => ({
    id: c.id,
    name: customerDisplayName(c),
    addresses: c.serviceAddresses.map((a) => ({
      id: a.id,
      label: a.label,
      street: a.street,
      city: a.city,
      postalCode: a.postalCode,
      objectType: a.objectType,
      apartment: a.apartment,
    })),
  }));
}
