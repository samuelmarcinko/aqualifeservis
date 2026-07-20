import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { customerDisplayName } from "@/lib/snapshots";
import { CustomerTypeBadge } from "@/components/ui/badges";
import { CustomerDetail } from "./customer-detail";
import { CustomerActions } from "./customer-actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      serviceAddresses: { where: { archivedAt: null }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      notes: { orderBy: { createdAt: "desc" }, take: 50 },
      quotations: { orderBy: { createdAt: "desc" } },
      protocols: { orderBy: { createdAt: "desc" } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!customer) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/zakaznici" className="btn-ghost mt-1 p-2">
            ←
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-navy">{customerDisplayName(customer)}</h1>
              <CustomerTypeBadge type={customer.type} />
              {customer.archivedAt && (
                <span className="badge bg-slate-200 text-slate-600">Archivovaný</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[customer.email, customer.phone].filter(Boolean).join(" · ") || "Bez kontaktu"}
            </p>
          </div>
        </div>
        <CustomerActions customerId={customer.id} archived={!!customer.archivedAt} />
      </div>

      <CustomerDetail
        customer={{
          id: customer.id,
          type: customer.type,
          firstName: customer.firstName,
          lastName: customer.lastName,
          businessName: customer.businessName,
          contactPerson: customer.contactPerson,
          ico: customer.ico,
          dic: customer.dic,
          icDph: customer.icDph,
          vatPayer: customer.vatPayer,
          email: customer.email,
          phone: customer.phone,
          phoneSecondary: customer.phoneSecondary,
          street: customer.street,
          city: customer.city,
          postalCode: customer.postalCode,
          country: customer.country,
          internalNote: customer.internalNote,
          createdAt: customer.createdAt.toISOString(),
        }}
        serviceAddresses={customer.serviceAddresses.map((a) => ({
          id: a.id,
          label: a.label,
          street: a.street,
          city: a.city,
          postalCode: a.postalCode,
          country: a.country,
          objectType: a.objectType,
          apartment: a.apartment,
          note: a.note,
          isDefault: a.isDefault,
        }))}
        notes={customer.notes.map((n) => ({
          id: n.id,
          body: n.body,
          createdAt: n.createdAt.toISOString(),
        }))}
        quotations={customer.quotations.map((q) => ({
          id: q.id,
          number: q.number,
          revision: q.revision,
          status: q.status,
          grandTotal: q.grandTotal.toString(),
          issueDate: q.issueDate.toISOString(),
        }))}
        protocols={customer.protocols.map((p) => ({
          id: p.id,
          number: p.number,
          revision: p.revision,
          status: p.status,
          documentDate: p.documentDate.toISOString(),
        }))}
        activities={customer.activities.map((a) => ({
          id: a.id,
          type: a.type,
          description: a.description,
          actor: a.actor?.name ?? "Systém",
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
