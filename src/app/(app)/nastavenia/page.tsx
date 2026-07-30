import { requireSuperAdmin } from "@/lib/session";
import {
  getCompanySettings,
  getSmtpSettings,
  toSafeSmtp,
  getAiSettings,
  toSafeAi,
} from "@/lib/services/settings";
import { PageHeader } from "@/components/ui/page";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireSuperAdmin();
  const [company, smtp, ai] = await Promise.all([
    getCompanySettings(),
    getSmtpSettings(),
    getAiSettings(),
  ]);
  const safeSmtp = toSafeSmtp(smtp);
  const safeAi = toSafeAi(ai);

  return (
    <div>
      <PageHeader title="Nastavenia" subtitle="Konfigurácia aplikácie (len super administrátor)" />
      <SettingsClient
        company={{
          name: company.name,
          street: company.street,
          city: company.city,
          postalCode: company.postalCode,
          country: company.country,
          ico: company.ico,
          dic: company.dic,
          icDph: company.icDph ?? "",
          vatPayer: company.vatPayer,
          vatPayerSince: company.vatPayerSince ? company.vatPayerSince.toISOString().slice(0, 10) : "",
          email: company.email,
          phone: company.phone,
          website: company.website ?? "",
          logoUrl: company.logoUrl,
          stampUrl: company.stampUrl,
          brandLight: company.brandLight,
          brandDark: company.brandDark,
          defaultVatRate: company.defaultVatRate.toString(),
          quotationValidityDays: company.quotationValidityDays,
          quotationPrefix: company.quotationPrefix,
          protocolPrefix: company.protocolPrefix,
          quotationEmailSubject: company.quotationEmailSubject,
          quotationEmailBody: company.quotationEmailBody,
          protocolEmailSubject: company.protocolEmailSubject,
          protocolEmailBody: company.protocolEmailBody,
        }}
        smtp={safeSmtp}
        ai={safeAi}
      />
    </div>
  );
}
