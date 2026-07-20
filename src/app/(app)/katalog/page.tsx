import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { CatalogManager } from "./catalog-manager";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const showArchived = sp.archived === "1";

  const items = await prisma.catalogItem.findMany({
    where: { archivedAt: showArchived ? { not: null } : null },
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader title="Katalóg položiek" subtitle="Služby a materiál pre cenové ponuky a protokoly" />
      <CatalogManager
        showArchived={showArchived}
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          description: i.description,
          defaultUnit: i.defaultUnit,
          defaultPrice: i.defaultPrice.toString(),
          defaultVatRate: i.defaultVatRate.toString(),
          usageCount: i.usageCount,
          archived: !!i.archivedAt,
        }))}
      />
    </div>
  );
}
