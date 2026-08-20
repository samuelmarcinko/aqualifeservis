import Link from "next/link";
import { prisma } from "@/lib/db";
import { getRentalSettings, getCompanySettings } from "@/lib/services/settings";
import { ToolCard } from "./tool-card";

export const dynamic = "force-dynamic";

// Demo fallback images (admin can upload a hero image in rental settings, and
// the section still looks intentional via the brand gradient if none loads).
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1400&q=70";
const WORKER_IMAGE =
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=70";

const BENEFITS = [
  { icon: "⚡", title: "Rýchla rezervácia", text: "Vyberte termín v kalendári a urobte nezáväznú rezerváciu online." },
  { icon: "🏅", title: "Profesionálna technika", text: "Značkové stroje na čistenie, monitoring a lokalizáciu porúch." },
  { icon: "🚚", title: "Dovoz na adresu", text: "Náradie vám na požiadanie dovezieme priamo na miesto." },
  { icon: "💬", title: "Odborné poradenstvo", text: "Poradíme s výberom aj obsluhou. Sme vodoinštalatéri z praxe." },
];

const STEPS = [
  { n: "1", icon: "🗓️", title: "Vyberte náradie", text: "Prezrite si katalóg a zvoľte stroj, ktorý potrebujete." },
  { n: "2", icon: "📅", title: "Zvoľte termín", text: "V kalendári kliknite na začiatočný a koncový deň prenájmu." },
  { n: "3", icon: "📄", title: "Odošlite rezerváciu", text: "Vyplňte kontaktné údaje. Rezervácia je nezáväzná, potvrdíme ju e-mailom." },
  { n: "4", icon: "🚚", title: "Prevezmite stroj", text: "Náradie si prevezmete na predajni alebo vám ho dovezieme." },
];

export default async function RentalHome() {
  const [settings, company, categories, featured] = await Promise.all([
    getRentalSettings(),
    getCompanySettings(),
    prisma.rentalCategory.findMany({
      where: { active: true, tools: { some: { active: true } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { tools: { where: { active: true } } } } },
    }),
    prisma.rentalTool.findMany({
      where: { active: true, category: { active: true } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      take: 3,
    }),
  ]);

  const phone = settings.contactPhone || company.phone;
  const heroImage = settings.heroImageUrl || DEFAULT_HERO_IMAGE;

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section id="o-nas" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark text-white">
        {/* right image, blended into the blue */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-3/5 lg:block">
          <div
            className="h-full w-full opacity-60"
            style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="absolute inset-0 bg-brand-dark/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/70 to-transparent" />
        </div>

        <div className="relative px-6 pb-28 pt-14 sm:px-10 sm:pb-32 sm:pt-16 lg:px-14 lg:pt-20">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
            AQUALIFE SERVIS – Požičovňa
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Požičovňa čistiacej a diagnostickej techniky
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/90 sm:text-lg">
            {settings.publicIntro ||
              "Profesionálne stroje na čistenie kanalizácií, monitoring potrubia, lokalizáciu porúch a vodoinštalatérske práce. Vyberte náradie, zvoľte termín a rezervujte online."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/naradie"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-dark shadow-lg transition hover:bg-slate-100"
            >
              Prezrieť náradie <span aria-hidden>→</span>
            </Link>
            {phone && (
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                <span aria-hidden>📞</span> {phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Benefits (overlapping hero bottom) ───────────────── */}
      <section className="relative z-10 -mt-16 grid grid-cols-1 gap-4 sm:-mt-20 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-cardhover">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-xl">{b.icon}</div>
            <h3 className="mt-3 font-semibold text-brand-navy">{b.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{b.text}</p>
          </div>
        ))}
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-navy">Kategórie náradia</h2>
              <p className="mt-1 text-slate-500">Vyberte oblasť a nájdite vhodný stroj.</p>
            </div>
            <Link href="/naradie" className="shrink-0 text-sm font-semibold text-brand-dark hover:underline">
              Zobraziť všetko →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/naradie?cat=${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-cardhover"
              >
                <div className="product-frame aspect-[4/3] p-5">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]" />
                  ) : (
                    <span className="text-5xl opacity-40">🛠️</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold leading-snug text-brand-navy group-hover:text-brand-dark">{c.name}</h3>
                    <p className="mt-0.5 text-xs font-medium text-brand">{c._count.tools} položiek</p>
                  </div>
                  <span aria-hidden className="text-brand-dark transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured tools ───────────────────────────────────── */}
      {featured.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-brand-navy">Obľúbené náradie</h2>
            <Link href="/naradie" className="shrink-0 text-sm font-semibold text-brand-dark hover:underline">
              Celý katalóg →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <ToolCard
                key={t.id}
                tool={{
                  slug: t.slug,
                  name: t.name,
                  model: t.model,
                  description: t.description,
                  imageUrl: t.imageUrl,
                  dailyPriceExVat: t.dailyPriceExVat.toString(),
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="ako-to-funguje">
        <h2 className="text-2xl font-bold text-brand-navy">Ako prebieha prenájom</h2>
        <p className="mt-1 text-slate-500">Jednoducho a online — v štyroch krokoch.</p>
        <div className="relative mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-slate-200 lg:block" />
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="flex items-center gap-3">
                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-navy text-lg font-bold text-white">
                  {s.n}
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
              <h3 className="mt-4 font-semibold text-brand-navy">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark text-white">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 lg:block">
          <div
            className="h-full w-full opacity-40"
            style={{ backgroundImage: `url(${WORKER_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/70 to-transparent" />
        </div>
        <div className="relative flex flex-col items-start gap-6 px-6 py-12 sm:flex-row sm:items-center sm:px-10 sm:py-14">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-3xl text-brand-dark shadow-lg">
            📞
          </div>
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Potrebujete poradiť s výberom?</h2>
            <p className="mt-2 text-white/85">
              Zavolajte nám alebo si rovno vyberte náradie a rezervujte termín online.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/naradie"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-dark transition hover:bg-slate-100"
              >
                Prezrieť náradie <span aria-hidden>→</span>
              </Link>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
                >
                  <span aria-hidden>📞</span> {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
