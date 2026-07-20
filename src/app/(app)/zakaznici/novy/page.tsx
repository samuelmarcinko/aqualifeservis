import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { CustomerForm } from "../customer-form";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nový zákazník" subtitle="Vytvorenie nového záznamu" />
      <CustomerForm />
    </div>
  );
}
