import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCompanySettings } from "@/lib/services/settings";
import { getCustomerOptions } from "@/lib/customer-options";
import { PageHeader } from "@/components/ui/page";
import { QuotationEditor } from "../../quotation-editor";

export const dynamic = "force-dynamic";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const q = await prisma.quotation.findUnique({ where: { id }, include: { items: true } });
  if (!q) notFound();
  if (q.locked) redirect(`/cenove-ponuky/${id}`);

  const [company, customers] = await Promise.all([getCompanySettings(), getCustomerOptions()]);

  return (
    <div>
      <PageHeader title={`Úprava ${q.number}`} subtitle={q.revision > 1 ? `Revízia ${q.revision}` : undefined} />
      <QuotationEditor
        customers={customers}
        defaultVatRate={Number(company.defaultVatRate)}
        validityDays={company.quotationValidityDays}
        initial={{
          id: q.id,
          customerId: q.customerId,
          serviceAddressId: null,
          issueDate: q.issueDate.toISOString(),
          validUntil: q.validUntil.toISOString(),
          taxMode: q.taxMode,
          noVatNote: q.noVatNote,
          documentDiscountType: q.documentDiscountType,
          documentDiscountValue: q.documentDiscountValue.toString(),
          internalNote: q.internalNote,
          customerNote: q.customerNote,
          items: q.items
            .sort((a, b) => a.position - b.position)
            .map((i) => ({
              description: i.description,
              detail: i.detail,
              quantity: i.quantity.toString(),
              unit: i.unit,
              unitPrice: i.unitPrice.toString(),
              discountPct: i.discountPct.toString(),
              vatRate: i.vatRate.toString(),
              catalogItemId: i.catalogItemId,
            })),
        }}
      />
    </div>
  );
}
