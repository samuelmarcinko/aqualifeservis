"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/session";
import { catalogItemSchema } from "@/lib/validation";
import { ok, fail, toSafeError, type ActionResult } from "@/lib/action-result";

export async function createCatalogItem(
  input: unknown,
): Promise<ActionResult<{ id: string; name: string; type: string; defaultUnit: string; defaultPrice: string; defaultVatRate: string }>> {
  try {
    await assertUser();
    const parsed = catalogItemSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const d = parsed.data;
    const item = await prisma.catalogItem.create({
      data: {
        name: d.name,
        type: d.type,
        description: d.description,
        defaultUnit: d.defaultUnit,
        defaultPrice: d.defaultPrice,
        defaultVatRate: d.defaultVatRate,
      },
    });
    revalidatePath("/katalog");
    return ok({
      id: item.id,
      name: item.name,
      type: item.type,
      defaultUnit: item.defaultUnit,
      defaultPrice: item.defaultPrice.toString(),
      defaultVatRate: item.defaultVatRate.toString(),
    });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function updateCatalogItem(id: string, input: unknown): Promise<ActionResult> {
  try {
    await assertUser();
    const parsed = catalogItemSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const d = parsed.data;
    await prisma.catalogItem.update({
      where: { id },
      data: {
        name: d.name,
        type: d.type,
        description: d.description,
        defaultUnit: d.defaultUnit,
        defaultPrice: d.defaultPrice,
        defaultVatRate: d.defaultVatRate,
      },
    });
    revalidatePath("/katalog");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function archiveCatalogItem(id: string, archive: boolean): Promise<ActionResult> {
  try {
    await assertUser();
    await prisma.catalogItem.update({
      where: { id },
      data: { archivedAt: archive ? new Date() : null },
    });
    revalidatePath("/katalog");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}
