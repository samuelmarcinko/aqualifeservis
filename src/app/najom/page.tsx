import Link from "next/link";
import { prisma } from "@/lib/db";
import { getRentalSettings } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

export default async function RentalHome() {
  const [settings, categories] = await Promise.all([
    getRentalSettings(),
    prisma.rentalCategory.findMany({
      where: { active: true, tools: { some: { active: true } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { tools: { where: { active: true } } } } },
    }),
  ]);

  return (
    <div>
      <section className="mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-14 text-white lg:px-12">
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl lg:text-5xl">
          Požičovňa čistiacej a diagnostickej techniky
        </h1>
        <p className="mt-4 max-w-2xl text-white/90">
          {settings.publicIntro ||
            "Profesionálne stroje na čistenie kanalizácií, monitoring potrubia, lokalizáciu porúch a vodoinštalatérske práce. Vyberte náradie, zvoľte termín a rezervujte online."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/naradie" className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-dark transition hover:bg-slate-100">
            Prezrieť náradie →
          </Link>
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-navy">Kategórie náradia</h2>
        <Link href="/naradie" className="text-sm font-medium text-brand-dark hover:underline">
          Zobraziť všetko →
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          Momentálne nie je k dispozícii žiadne náradie.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/naradie?cat=${c.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:shadow-cardhover"
            >
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <span className="text-4xl">🛠️</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-brand-navy group-hover:text-brand-dark">{c.name}</h3>
                {c.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>}
                <p className="mt-2 text-xs font-medium text-brand">{c._count.tools} položiek →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
