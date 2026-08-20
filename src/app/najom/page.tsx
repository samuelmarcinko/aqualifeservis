import Link from "next/link";
import { prisma } from "@/lib/db";
import { getRentalSettings, getCompanySettings } from "@/lib/services/settings";
import { ToolCard } from "./tool-card";

export const dynamic = "force-dynamic";

// Demo hero image (admin can replace the visual later). A brand gradient sits
// underneath so the hero still looks intentional if the image fails to load.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1600&q=70";

const BENEFITS = [
  { icon: "⚡", title: "Rýchla rezervácia", text: "Vyberte termín v kalendári a odošlite nezáväznú rezerváciu online." },
  { icon: "🛠️", title: "Profesionálna technika", text: "Značkové stroje na čistenie, monitoring a lokalizáciu porúch." },
  { icon: "🚚", title: "Dovoz na adresu", text: "Náradie vám na požiadanie dovezieme priamo na miesto." },
  { icon: "💬", title: "Odborné poradenstvo", text: "Poradíme s výberom aj obsluhou. Sme vodoinštalatéri z praxe." },
];

const STEPS = [
  { n: "1", title: "Vyberte náradie", text: "Prezrite si katalóg a otvorte stroj, ktorý potrebujete." },
  { n: "2", title: "Zvoľte termín", text: "V kalendári kliknite na začiatočný a koncový deň prenájmu." },
  { n: "3", title: "Odošlite rezerváciu", text: "Vyplňte kontakt. Rezervácia je nezáväzná, potvrdíme ju e-mailom." },
  { n: "4", title: "Prevezmite stroj", text: "Náradie si prevezmete na predajni alebo vám ho dovezieme." },
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

  return (
    <div className="space-y-14 sm:space-y-20">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark text-white">
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{ backgroundImage: `url(${HERO_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="dot-pattern absolute inset-0 opacity-40" />
        <div className="relative px-6 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            AQUALIFE SERVIS · Požičovňa
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Požičovňa čistiacej a diagnostickej techniky
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
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

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-xl">{b.icon}</div>
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                    <h3 className="font-semibold text-brand-navy group-hover:text-brand-dark">{c.name}</h3>
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
      <section className="rounded-3xl bg-slate-50 p-6 sm:p-10">
        <h2 className="text-2xl font-bold text-brand-navy">Ako prebieha prenájom</h2>
        <p className="mt-1 text-slate-500">Jednoducho a online — v štyroch krokoch.</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-dark text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-brand-navy">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl bg-brand-navy px-6 py-12 text-center text-white sm:px-10 sm:py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Potrebujete poradiť s výberom?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Zavolajte nám alebo si rovno vyberte náradie a rezervujte termín online.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
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
      </section>
    </div>
  );
}
