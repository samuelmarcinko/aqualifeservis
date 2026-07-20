import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/ui/logo";

export const dynamic = "force-dynamic";

async function getLogoUrl(): Promise<string | null> {
  try {
    const c = await prisma.companySettings.findUnique({
      where: { id: "company" },
      select: { logoUrl: true },
    });
    return c?.logoUrl ?? null;
  } catch {
    return null;
  }
}

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/prehlad");
  const logoUrl = await getLogoUrl();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/10 via-slate-50 to-brand-dark/10 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo logoUrl={logoUrl} className={logoUrl ? "h-14" : "scale-125"} />
          <p className="text-sm text-slate-500">Interná administrácia</p>
        </div>
        <div className="card p-8">
          <h1 className="mb-1 text-xl font-bold text-brand-navy">Prihlásenie</h1>
          <p className="mb-6 text-sm text-slate-500">
            Prihláste sa pomocou svojho e-mailu a hesla.
          </p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          AQUALIFE SERVIS s. r. o. — prístup len pre oprávnených používateľov.
        </p>
      </div>
    </div>
  );
}
