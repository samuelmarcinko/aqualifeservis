import type { Metadata } from "next";
import Link from "next/link";
import { getCompanySettings, getRentalSettings } from "@/lib/services/settings";
import { PublicNav } from "./public-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Požičovňa náradia – AQUALIFE SERVIS",
  description:
    "Prenájom profesionálnej čistiacej a diagnostickej techniky – čistenie kanalizácií, monitoring potrubia, lokalizácia porúch a vodoinštalatérske náradie.",
  robots: { index: true, follow: true },
};

export default async function RentalPublicLayout({ children }: { children: React.ReactNode }) {
  const [company, settings] = await Promise.all([getCompanySettings(), getRentalSettings()]);
  const phone = settings.contactPhone || company.phone;
  const email = settings.contactEmail || company.email;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="h-16 w-auto max-w-[260px] object-contain" />
            ) : (
              <span className="text-2xl font-extrabold tracking-tight text-brand-navy">
                AQUALIFE <span className="text-brand">Požičovňa</span>
              </span>
            )}
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <PublicNav />
            <div className="hidden items-center gap-4 border-l border-slate-200 pl-4 text-sm text-slate-600 md:flex">
              {phone && <a href={`tel:${phone.replace(/\s+/g, "")}`} className="font-medium hover:text-brand-dark">{phone}</a>}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 lg:px-6">
          <div className="font-semibold text-brand-navy">{company.name}</div>
          <div>
            {company.street}, {company.postalCode} {company.city} · IČO: {company.ico}
          </div>
          <div>
            {email} · {phone}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Všetky ceny sú za jeden deň prenájmu. Rezervácia je nezáväzný dopyt, ktorý potvrdíme.
          </div>
        </div>
      </footer>
    </div>
  );
}
