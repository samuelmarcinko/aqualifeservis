import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCustomerOptions } from "@/lib/customer-options";
import { isAiReady } from "@/lib/services/settings";
import { PageHeader } from "@/components/ui/page";
import { ProtocolEditor } from "../../protocol-editor";

export const dynamic = "force-dynamic";

export default async function EditProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const p = await prisma.repairProtocol.findUnique({ where: { id }, include: { workItems: true } });
  if (!p) notFound();
  if (p.locked) redirect(`/protokoly/${id}`);
  const [customers, aiEnabled] = await Promise.all([getCustomerOptions(), isAiReady()]);

  return (
    <div>
      <PageHeader title={`Úprava ${p.number}`} subtitle={p.revision > 1 ? `Revízia ${p.revision}` : undefined} />
      <ProtocolEditor
        customers={customers}
        aiEnabled={aiEnabled}
        initial={{
          id: p.id,
          customerId: p.customerId,
          serviceAddressId: null,
          insuranceEventNumber: p.insuranceEventNumber,
          documentDate: p.documentDate.toISOString(),
          faultDate: p.faultDate?.toISOString() ?? null,
          repairDate: p.repairDate?.toISOString() ?? null,
          objectStreet: p.objectStreet,
          objectCity: p.objectCity,
          objectPostalCode: p.objectPostalCode,
          objectType: p.objectType,
          objectApartment: p.objectApartment,
          insuranceContractNumber: p.insuranceContractNumber,
          insurer: p.insurer,
          objectNote: p.objectNote,
          faultType: p.faultType,
          faultCause: p.faultCause,
          faultDescription: p.faultDescription,
          damageExtent: p.damageExtent,
          technicianStatement: p.technicianStatement,
          notes: p.notes,
          recommendations: p.recommendations,
          workItems: p.workItems
            .sort((a, b) => a.position - b.position)
            .map((w) => ({
              description: w.description,
              quantity: w.quantity?.toString() ?? null,
              unit: w.unit,
              internalNote: w.internalNote,
              catalogItemId: w.catalogItemId,
            })),
        }}
      />
    </div>
  );
}
