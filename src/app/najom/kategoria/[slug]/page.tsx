import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ToolCard } from "../../tool-card";

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
      )}
    </div>
  );
}
