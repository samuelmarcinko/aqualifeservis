import { prisma } from "@/lib/db";
import { ToolsBrowser } from "./tools-browser";

export const dynamic = "force-dynamic";

export default async function ToolsListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [categories, tools] = await Promise.all([
    prisma.rentalCategory.findMany({
      where: { active: true, tools: { some: { active: true } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    prisma.rentalTool.findMany({
      where: { active: true, category: { active: true } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { category: { select: { slug: true } } },
    }),
  ]);

  const initialCat = sp.cat && categories.some((c) => c.slug === sp.cat) ? sp.cat : "all";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-navy">Požičovňa náradia</h1>
      <p className="mb-6 text-slate-500">Vyberte kategóriu a náradie, ktoré si chcete prenajať.</p>

      <ToolsBrowser
        initialCat={initialCat}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        tools={tools.map((t) => ({
          slug: t.slug,
          name: t.name,
          model: t.model,
          description: t.description,
          imageUrl: t.imageUrl,
          dailyPriceExVat: t.dailyPriceExVat.toString(),
          categorySlug: t.category.slug,
        }))}
      />
    </div>
  );
}
