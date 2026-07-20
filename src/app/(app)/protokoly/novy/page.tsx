import { requireUser } from "@/lib/session";
import { getCustomerOptions } from "@/lib/customer-options";
import { PageHeader } from "@/components/ui/page";
import { ProtocolEditor } from "../protocol-editor";

export const dynamic = "force-dynamic";

export default async function NewProtocolPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const customers = await getCustomerOptions();
  return (
    <div>
      <PageHeader title="Nový protokol o oprave" />
      <ProtocolEditor customers={customers} preselectCustomerId={sp.customerId} />
    </div>
  );
}
