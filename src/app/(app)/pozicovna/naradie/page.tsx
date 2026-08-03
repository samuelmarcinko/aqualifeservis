import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { RentalSubnav } from "../rental-subnav";
import { ToolsManager } from "./tools-manager";

export const dynamic = "force-dynamic";

export default async function RentalToolsPage() {
  await requireUser();
  const categories = await prisma.rentalCategory.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      tools: { orderBy: [{ position: "asc" }, { name: "asc" }] },
    },
  });

  return (
    <div>
      <PageHeader title="Požičovňa" subtitle="Kategórie a náradie" />
      <RentalSubnav />
      <ToolsManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          position: c.position,
          active: c.active,
          imageUrl: c.imageUrl,
          tools: c.tools.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            accessories: t.accessories,
            dailyPriceExVat: t.dailyPriceExVat.toString(),
            vatRate: t.vatRate.toString(),
            quantity: t.quantity,
            position: t.position,
            active: t.active,
            imageUrl: t.imageUrl,
          })),
        }))}
      />
    </div>
  );
}
