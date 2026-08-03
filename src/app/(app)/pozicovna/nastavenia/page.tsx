import { requireSuperAdmin } from "@/lib/session";
import { getRentalSettings } from "@/lib/services/settings";
import { PageHeader } from "@/components/ui/page";
import { RentalSubnav } from "../rental-subnav";
import { RentalSettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function RentalSettingsPage() {
  await requireSuperAdmin();
  const s = await getRentalSettings();

  return (
    <div>
      <PageHeader title="Požičovňa" subtitle="Nastavenia požičovne (len super administrátor)" />
      <RentalSubnav />
      <RentalSettingsForm
        settings={{
          deliveryPricePerKm: s.deliveryPricePerKm.toString(),
          maxDeliveryKm: s.maxDeliveryKm,
          minRentalDays: s.minRentalDays,
          publicIntro: s.publicIntro ?? "",
          termsText: s.termsText ?? "",
          contactEmail: s.contactEmail ?? "",
          contactPhone: s.contactPhone ?? "",
          ownerNotifyEmail: s.ownerNotifyEmail ?? "",
          customerEmailSubject: s.customerEmailSubject,
          customerEmailBody: s.customerEmailBody,
          approvedEmailSubject: s.approvedEmailSubject,
          approvedEmailBody: s.approvedEmailBody,
          rejectedEmailSubject: s.rejectedEmailSubject,
          rejectedEmailBody: s.rejectedEmailBody,
        }}
      />
    </div>
  );
}
