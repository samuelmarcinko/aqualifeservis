import { prisma } from "@/lib/db";
import { CATALOG_TYPE_LABELS } from "@/lib/constants";

export interface ItemSuggestion {
  source: "CATALOG" | "QUOTATION" | "PROTOCOL";
  name: string;
  typeLabel: string;
  defaultUnit: string;
  defaultPrice: string | null;
  lastUsedPrice: string | null;
  vatRate: string | null;
  usageCount: number;
  catalogItemId?: string;
}

/**
 * Autocomplete suggestions for document line items, drawn from active catalog
 * items and previously used quotation / protocol items. Case-insensitive.
 */
export async function getItemSuggestions(query: string): Promise<ItemSuggestion[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const [catalog, quotationItems, protocolItems] = await Promise.all([
    prisma.catalogItem.findMany({
      where: { archivedAt: null, name: { contains: q, mode: "insensitive" } },
      orderBy: [{ usageCount: "desc" }, { name: "asc" }],
      take: 8,
    }),
    prisma.quotationItem.findMany({
      where: { description: { contains: q, mode: "insensitive" } },
      orderBy: { id: "desc" },
      distinct: ["description"],
      take: 6,
    }),
    prisma.protocolWorkItem.findMany({
      where: { description: { contains: q, mode: "insensitive" } },
      orderBy: { id: "desc" },
      distinct: ["description"],
      take: 6,
    }),
  ]);

  const seen = new Set<string>();
  const out: ItemSuggestion[] = [];

  for (const c of catalog) {
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      source: "CATALOG",
      name: c.name,
      typeLabel: CATALOG_TYPE_LABELS[c.type] ?? c.type,
      defaultUnit: c.defaultUnit,
      defaultPrice: c.defaultPrice.toString(),
      lastUsedPrice: null,
      vatRate: c.defaultVatRate.toString(),
      usageCount: c.usageCount,
      catalogItemId: c.id,
    });
  }

  for (const qi of quotationItems) {
    const key = qi.description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      source: "QUOTATION",
      name: qi.description,
      typeLabel: "Z ponuky",
      defaultUnit: qi.unit,
      defaultPrice: null,
      lastUsedPrice: qi.unitPrice.toString(),
      vatRate: qi.vatRate.toString(),
      usageCount: 0,
    });
  }

  for (const pi of protocolItems) {
    const key = pi.description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      source: "PROTOCOL",
      name: pi.description,
      typeLabel: "Z protokolu",
      defaultUnit: pi.unit ?? "ks",
      defaultPrice: null,
      lastUsedPrice: null,
      vatRate: null,
      usageCount: 0,
    });
  }

  return out.slice(0, 12);
}
