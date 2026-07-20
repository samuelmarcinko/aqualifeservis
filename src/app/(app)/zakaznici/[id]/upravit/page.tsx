import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { CustomerForm } from "../../customer-form";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Úprava zákazníka" />
      <CustomerForm
        customerId={c.id}
        defaultValues={{
          type: c.type,
          firstName: c.firstName ?? undefined,
          lastName: c.lastName ?? undefined,
          businessName: c.businessName ?? undefined,
          contactPerson: c.contactPerson ?? undefined,
          ico: c.ico ?? undefined,
          dic: c.dic ?? undefined,
          icDph: c.icDph ?? undefined,
          vatPayer: c.vatPayer,
          email: c.email ?? undefined,
          phone: c.phone ?? undefined,
          phoneSecondary: c.phoneSecondary ?? undefined,
          street: c.street ?? undefined,
          city: c.city ?? undefined,
          postalCode: c.postalCode ?? undefined,
          country: c.country,
          internalNote: c.internalNote ?? undefined,
        }}
      />
    </div>
  );
}
