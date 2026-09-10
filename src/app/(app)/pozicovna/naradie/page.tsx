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
      tools: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          accessoryGroups: {
            orderBy: [{ position: "asc" }, { name: "asc" }],
            include: {
              options: { orderBy: [{ position: "asc" }, { name: "asc" }] },
            },
          },
        },
      },
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
            model: t.model,
            description: t.description,
            accessories: t.accessories,
            dailyPriceExVat: t.dailyPriceExVat.toString(),
            vatRate: t.vatRate.toString(),
            quantity: t.quantity,
            position: t.position,
            active: t.active,
            imageUrl: t.imageUrl,
            galleryPhotos: ((t.galleryPhotos as unknown as { url: string }[]) ?? []).map((p) => p.url),
            manuals: ((t.manuals as unknown as { url: string; name?: string }[]) ?? []).map((m) => ({ url: m.url, name: m.name ?? "manual.pdf" })),
            videos: ((t.videos as unknown as string[]) ?? []),
            accessoryGroups: t.accessoryGroups.map((g) => ({
              id: g.id,
              name: g.name,
              required: g.required,
              position: g.position,
              active: g.active,
              options: g.options.map((o) => ({
                id: o.id,
                name: o.name,
                description: o.description,
                imageUrl: o.imageUrl,
                dailyPriceExVat: o.dailyPriceExVat.toString(),
                position: o.position,
                active: o.active,
              })),
            })),
          })),
        }))}
      />
    </div>
  );
}
