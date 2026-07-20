import { requireUser } from "@/lib/session";
import { getCompanySettings } from "@/lib/services/settings";
import { getCustomerOptions } from "@/lib/customer-options";
import { PageHeader } from "@/components/ui/page";
import { QuotationEditor } from "../quotation-editor";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const [company, customers] = await Promise.all([getCompanySettings(), getCustomerOptions()]);

  return (
    <div>
      <PageHeader title="Nová cenová ponuka" />
      <QuotationEditor
        customers={customers}
        defaultVatRate={Number(company.defaultVatRate)}
        validityDays={company.quotationValidityDays}
        preselectCustomerId={sp.customerId}
      />
    </div>
  );
}
