import { requireUser } from "@/lib/session";
import { getCachedBranding } from "@/lib/services/settings";
import { AppShell } from "@/components/shell/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, branding] = await Promise.all([requireUser(), getCachedBranding()]);
  return (
    <AppShell user={user} logoUrl={branding.logoUrl} companyName={branding.name}>
      {children}
    </AppShell>
  );
}
