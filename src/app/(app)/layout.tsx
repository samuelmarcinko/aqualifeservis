import { requireUser } from "@/lib/session";
import { getCompanySettings } from "@/lib/services/settings";
import { AppShell } from "@/components/shell/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, company] = await Promise.all([requireUser(), getCompanySettings()]);
  return (
    <AppShell user={user} logoUrl={company.logoUrl} companyName={company.name}>
      {children}
    </AppShell>
  );
}
