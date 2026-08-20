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

      <footer id="kontakt" className="mt-8 border-t border-slate-200 bg-white">
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
            <div className="mt-4 flex gap-2">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-brand hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V14h2.6v8h3.6Z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-brand hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4a3.8 3.8 0 0 1-1.4-.9 3.8 3.8 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1a3.3 3.3 0 0 0-.8-1.3 3.3 3.3 0 0 0-1.3-.8c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-3.3a1.1 1.1 0 1 1 0 2.3 1.1 1.1 0 0 1 0-2.3Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold text-brand-navy">Navigácia</div>
            <ul className="space-y-1.5">
              <li><Link href="/" className="hover:text-brand-dark">Úvod</Link></li>
              <li><Link href="/naradie" className="hover:text-brand-dark">Požičovňa náradia</Link></li>
              <li><Link href="/#ako-to-funguje" className="hover:text-brand-dark">Ako to funguje</Link></li>
              <li><Link href="/#o-nas" className="hover:text-brand-dark">O nás</Link></li>
              <li><Link href="/#kontakt" className="hover:text-brand-dark">Kontakt</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-2 font-semibold text-brand-navy">Kontakt</div>
            <ul className="space-y-1.5">
              {phone && <li><a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-brand-dark">📞 {phone}</a></li>}
              {email && <li><a href={`mailto:${email}`} className="hover:text-brand-dark">✉️ {email}</a></li>}
              <li>📍 {company.street}, {company.postalCode} {company.city}</li>
            </ul>
          </div>

          <div>
            <div className="mb-2 font-semibold text-brand-navy">Sídlo</div>
            <p>{company.name}</p>
            <p>{company.street}</p>
            <p>{company.postalCode} {company.city}</p>
            <p className="mt-1 text-xs text-slate-400">IČO: {company.ico}</p>
            {company.icDph && <p className="text-xs text-slate-400">IČ DPH: {company.icDph}</p>}
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <span>© {new Date().getFullYear()} {company.name}. Všetky práva vyhradené.</span>
            <span>Rezervácia je nezáväzný dopyt, ktorý potvrdíme.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
