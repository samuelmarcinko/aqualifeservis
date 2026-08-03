import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RentalCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.rentalCategory.findUnique({
    where: { slug },
    include: {
      tools: { where: { active: true }, orderBy: [{ position: "asc" }, { name: "asc" }] },
    },
  });
  if (!category || !category.active) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-brand-dark hover:underline">
        ← Späť na kategórie
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-bold text-brand-navy">{category.name}</h1>
      {category.description && <p className="mb-6 max-w-2xl text-slate-500">{category.description}</p>}

      {category.tools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          V tejto kategórii momentálne nie je dostupné náradie.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {category.tools.map((t) => (
            <Link
              key={t.id}
              href={`/naradie/${t.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:shadow-cardhover"
            >
              <div className="flex h-44 items-center justify-center overflow-hidden bg-slate-100">
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <span className="text-4xl">🧰</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold text-brand-navy group-hover:text-brand-dark">{t.name}</h3>
                {t.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>}
                <div className="mt-auto pt-3">
                  <span className="text-lg font-bold text-brand-dark">{formatCurrency(t.dailyPriceExVat)}</span>
                  <span className="text-sm text-slate-400"> / deň bez DPH</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
