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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="relative mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:h-24 lg:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="h-12 w-auto max-w-[200px] object-contain sm:h-16 sm:max-w-[260px]" />
            ) : (
              <span className="text-xl font-extrabold tracking-tight text-brand-navy sm:text-2xl">
                AQUALIFE <span className="text-brand">Požičovňa</span>
              </span>
            )}
          </Link>
          <PublicNav phone={phone} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8 lg:px-6">{children}</main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          <div className="sm:col-span-2 lg:col-span-1">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="mb-3 h-12 w-auto max-w-[200px] object-contain" />
            ) : (
              <div className="mb-2 text-lg font-extrabold text-brand-navy">{company.name}</div>
            )}
            <p className="text-slate-500">
              Prenájom profesionálnej čistiacej a diagnostickej techniky pre vodoinštalatérske práce.
            </p>
          </div>

          <div>
            <div className="mb-2 font-semibold text-brand-navy">Navigácia</div>
            <ul className="space-y-1.5">
              <li><Link href="/" className="hover:text-brand-dark">Úvod</Link></li>
              <li><Link href="/naradie" className="hover:text-brand-dark">Požičovňa náradia</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-2 font-semibold text-brand-navy">Kontakt</div>
            <ul className="space-y-1.5">
              {phone && <li><a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-brand-dark">📞 {phone}</a></li>}
              {email && <li><a href={`mailto:${email}`} className="hover:text-brand-dark">✉️ {email}</a></li>}
            </ul>
          </div>

          <div>
            <div className="mb-2 font-semibold text-brand-navy">Sídlo</div>
            <p>{company.name}</p>
            <p>{company.street}</p>
            <p>{company.postalCode} {company.city}</p>
            <p className="mt-1 text-xs text-slate-400">IČO: {company.ico}</p>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-400 lg:px-6">
            © {new Date().getFullYear()} {company.name}. Všetky ceny sú za jeden deň prenájmu. Rezervácia je nezáväzný dopyt, ktorý potvrdíme.
          </div>
        </div>
      </footer>
    </div>
  );
}
