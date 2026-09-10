"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertUser, assertSuperAdmin } from "@/lib/session";
import {
  rentalCategorySchema,
  rentalToolSchema,
  rentalBlockSchema,
  rentalSettingsSchema,
  rentalReservationEditSchema,
  rentalToolVideosSchema,
  rentalAccessoryGroupSchema,
  rentalAccessoryOptionSchema,
  zodErrorMessage,
} from "@/lib/validation";
import { ok, fail, toSafeError, type ActionResult } from "@/lib/action-result";
import { sanitizeRichText } from "@/lib/sanitize";
import { uploadBlob, deleteBlob } from "@/lib/services/blob";
import { getRentalSettings } from "@/lib/services/settings";
import { slugify } from "@/lib/services/rental-core";
import {
  approveReservation,
  rejectReservation,
  cancelReservation,
  deleteReservation,
  updateReservation,
  createBlock,
  deleteBooking,
} from "@/lib/services/rental";

async function uniqueSlug(kind: "category" | "tool", name: string, currentId?: string): Promise<string> {
  const base = slugify(name) || "polozka";
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing =
      kind === "category"
        ? await prisma.rentalCategory.findUnique({ where: { slug } })
        : await prisma.rentalTool.findUnique({ where: { slug } });
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${i++}`;
  }
}

// --- Categories ------------------------------------------------------------

export async function saveCategory(input: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  try {
    await assertUser();
    const parsed = rentalCategorySchema.safeParse(input);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    const d = parsed.data;
    if (id) {
      await prisma.rentalCategory.update({
        where: { id },
        data: { name: d.name, description: d.description, position: d.position, active: d.active },
      });
      revalidatePath("/pozicovna/naradie");
      return ok({ id });
    }
    const cat = await prisma.rentalCategory.create({
      data: {
        name: d.name,
        slug: await uniqueSlug("category", d.name),
        description: d.description,
        position: d.position,
        active: d.active,
      },
    });
    revalidatePath("/pozicovna/naradie");
    return ok({ id: cat.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await assertUser();
    const count = await prisma.rentalTool.count({ where: { categoryId: id } });
    if (count > 0) return fail("Najprv presuňte alebo odstráňte náradie z tejto kategórie.");
    const cat = await prisma.rentalCategory.findUnique({ where: { id } });
    if (cat?.imageUrl) await deleteBlob(cat.imageUrl);
    await prisma.rentalCategory.delete({ where: { id } });
    revalidatePath("/pozicovna/naradie");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function uploadCategoryImage(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return uploadImage("category", id, formData);
}

// --- Tools -----------------------------------------------------------------

export async function saveTool(input: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  try {
    await assertUser();
    const parsed = rentalToolSchema.safeParse(input);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    const d = parsed.data;
    const data = {
      categoryId: d.categoryId,
      name: d.name,
      model: d.model,
      description: sanitizeRichText(d.description) || null,
      accessories: d.accessories,
      dailyPriceExVat: d.dailyPriceExVat,
      vatRate: d.vatRate,
      quantity: d.quantity,
      position: d.position,
      active: d.active,
    };
    if (id) {
      await prisma.rentalTool.update({ where: { id }, data });
      revalidatePath("/pozicovna/naradie");
      return ok({ id });
    }
    const tool = await prisma.rentalTool.create({
      data: { ...data, slug: await uniqueSlug("tool", d.name) },
    });
    revalidatePath("/pozicovna/naradie");
    return ok({ id: tool.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteTool(id: string): Promise<ActionResult> {
  try {
    await assertUser();
    const count = await prisma.rentalReservation.count({ where: { toolId: id } });
    if (count > 0) return fail("Náradie má rezervácie – nie je možné ho zmazať. Deaktivujte ho.");
    const tool = await prisma.rentalTool.findUnique({ where: { id } });
    if (tool?.imageUrl) await deleteBlob(tool.imageUrl);
    await prisma.rentalTool.delete({ where: { id } });
    revalidatePath("/pozicovna/naradie");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function uploadToolImage(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return uploadImage("tool", id, formData);
}

type MediaItem = { url: string; path: string; name?: string };

export async function uploadToolGalleryPhoto(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ photos: string[] }>> {
  try {
    await assertUser();
    const file = formData.get("image");
    if (!(file instanceof File)) return fail("Chýba súbor.");
    if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type))
      return fail("Nepodporovaný formát (PNG, JPG, WEBP, AVIF).");
    if (file.size > 5 * 1024 * 1024) return fail("Obrázok presahuje 5 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await uploadBlob(`rental/tool/gallery/${file.name}`, buffer, file.type);
    const tool = await prisma.rentalTool.findUniqueOrThrow({ where: { id } });
    const gallery = [...((tool.galleryPhotos as unknown as MediaItem[]) ?? []), { url: blob.url, path: blob.pathname }].slice(0, 12);
    await prisma.rentalTool.update({ where: { id }, data: { galleryPhotos: gallery } });
    revalidatePath("/pozicovna/naradie");
    return ok({ photos: gallery.map((p) => p.url) });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteToolGalleryPhoto(
  id: string,
  url: string,
): Promise<ActionResult<{ photos: string[] }>> {
  try {
    await assertUser();
    const tool = await prisma.rentalTool.findUniqueOrThrow({ where: { id } });
    const gallery = ((tool.galleryPhotos as unknown as MediaItem[]) ?? []).filter((p) => p.url !== url);
    await deleteBlob(url);
    await prisma.rentalTool.update({ where: { id }, data: { galleryPhotos: gallery } });
    revalidatePath("/pozicovna/naradie");
    return ok({ photos: gallery.map((p) => p.url) });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

type ManualOut = { url: string; name: string };

export async function uploadToolManual(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ manuals: ManualOut[] }>> {
  try {
    await assertUser();
    const file = formData.get("manual");
    if (!(file instanceof File)) return fail("Chýba súbor.");
    if (file.type !== "application/pdf") return fail("Manuál musí byť vo formáte PDF.");
    if (file.size > 25 * 1024 * 1024) return fail("PDF presahuje 25 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await uploadBlob(`rental/tool/manuals/${file.name}`, buffer, "application/pdf");
    const tool = await prisma.rentalTool.findUniqueOrThrow({ where: { id } });
    const manuals = [
      ...((tool.manuals as unknown as MediaItem[]) ?? []),
      { url: blob.url, path: blob.pathname, name: file.name },
    ].slice(0, 12);
    await prisma.rentalTool.update({ where: { id }, data: { manuals } });
    revalidatePath("/pozicovna/naradie");
    return ok({ manuals: manuals.map((m) => ({ url: m.url, name: m.name ?? "manual.pdf" })) });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteToolManual(
  id: string,
  url: string,
): Promise<ActionResult<{ manuals: ManualOut[] }>> {
  try {
    await assertUser();
    const tool = await prisma.rentalTool.findUniqueOrThrow({ where: { id } });
    const manuals = ((tool.manuals as unknown as MediaItem[]) ?? []).filter((p) => p.url !== url);
    await deleteBlob(url);
    await prisma.rentalTool.update({ where: { id }, data: { manuals } });
    revalidatePath("/pozicovna/naradie");
    return ok({ manuals: manuals.map((m) => ({ url: m.url, name: m.name ?? "manual.pdf" })) });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

// --- Accessories (groups + options) ----------------------------------------

export async function saveAccessoryGroup(
  toolId: string,
  input: unknown,
  groupId?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertUser();
    const parsed = rentalAccessoryGroupSchema.safeParse(input);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    const d = parsed.data;
    if (groupId) {
      await prisma.rentalAccessoryGroup.update({ where: { id: groupId }, data: d });
      revalidatePath("/pozicovna/naradie");
      return ok({ id: groupId });
    }
    const g = await prisma.rentalAccessoryGroup.create({ data: { ...d, toolId } });
    revalidatePath("/pozicovna/naradie");
    return ok({ id: g.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteAccessoryGroup(groupId: string): Promise<ActionResult> {
  try {
    await assertUser();
    const options = await prisma.rentalAccessoryOption.findMany({
      where: { groupId },
      select: { imageUrl: true },
    });
    await Promise.all(options.filter((o) => o.imageUrl).map((o) => deleteBlob(o.imageUrl!)));
    await prisma.rentalAccessoryGroup.delete({ where: { id: groupId } });
    revalidatePath("/pozicovna/naradie");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function saveAccessoryOption(
  groupId: string,
  input: unknown,
  optionId?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertUser();
    const parsed = rentalAccessoryOptionSchema.safeParse(input);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    const d = parsed.data;
    if (optionId) {
      await prisma.rentalAccessoryOption.update({ where: { id: optionId }, data: d });
      revalidatePath("/pozicovna/naradie");
      return ok({ id: optionId });
    }
    const o = await prisma.rentalAccessoryOption.create({ data: { ...d, groupId } });
    revalidatePath("/pozicovna/naradie");
    return ok({ id: o.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteAccessoryOption(optionId: string): Promise<ActionResult> {
  try {
    await assertUser();
    const opt = await prisma.rentalAccessoryOption.findUnique({ where: { id: optionId } });
    if (opt?.imageUrl) await deleteBlob(opt.imageUrl);
    await prisma.rentalAccessoryOption.delete({ where: { id: optionId } });
    revalidatePath("/pozicovna/naradie");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function uploadAccessoryOptionImage(
  optionId: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    await assertUser();
    const file = formData.get("image");
    if (!(file instanceof File)) return fail("Chýba súbor.");
    if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type))
      return fail("Nepodporovaný formát (PNG, JPG, WEBP, AVIF).");
    if (file.size > 5 * 1024 * 1024) return fail("Obrázok presahuje 5 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await uploadBlob(`rental/accessory/${file.name}`, buffer, file.type);
    const cur = await prisma.rentalAccessoryOption.findUnique({ where: { id: optionId } });
    if (cur?.imageUrl) await deleteBlob(cur.imageUrl);
    await prisma.rentalAccessoryOption.update({
      where: { id: optionId },
      data: { imageUrl: blob.url, imageBlobPath: blob.pathname },
    });
    revalidatePath("/pozicovna/naradie");
    return ok({ url: blob.url });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function saveToolVideos(id: string, videos: string[]): Promise<ActionResult> {
  try {
    await assertUser();
    const parsed = rentalToolVideosSchema.safeParse({ videos });
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    await prisma.rentalTool.update({ where: { id }, data: { videos: parsed.data.videos } });
    revalidatePath("/pozicovna/naradie");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

async function uploadImage(
  kind: "category" | "tool",
  id: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    await assertUser();
    const file = formData.get("image");
    if (!(file instanceof File)) return fail("Chýba súbor.");
    if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type))
      return fail("Nepodporovaný formát (PNG, JPG, WEBP, AVIF).");
    if (file.size > 5 * 1024 * 1024) return fail("Obrázok presahuje 5 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await uploadBlob(`rental/${kind}/${file.name}`, buffer, file.type);
    if (kind === "category") {
      const cur = await prisma.rentalCategory.findUnique({ where: { id } });
      if (cur?.imageUrl) await deleteBlob(cur.imageUrl);
      await prisma.rentalCategory.update({ where: { id }, data: { imageUrl: blob.url, imageBlobPath: blob.pathname } });
    } else {
      const cur = await prisma.rentalTool.findUnique({ where: { id } });
      if (cur?.imageUrl) await deleteBlob(cur.imageUrl);
      await prisma.rentalTool.update({ where: { id }, data: { imageUrl: blob.url, imageBlobPath: blob.pathname } });
    }
    revalidatePath("/pozicovna/naradie");
    return ok({ url: blob.url });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

// --- Reservations ----------------------------------------------------------

export async function approveReservationAction(id: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await approveReservation(id, user.id);
    revalidatePath("/pozicovna");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function rejectReservationAction(id: string, note?: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await rejectReservation(id, user.id, note);
    revalidatePath("/pozicovna");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function cancelReservationAction(id: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await cancelReservation(id, user.id);
    revalidatePath("/pozicovna");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteReservationAction(id: string): Promise<ActionResult> {
  try {
    await assertUser();
    await deleteReservation(id);
    revalidatePath("/pozicovna");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function updateReservationAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    await assertUser();
    const parsed = rentalReservationEditSchema.safeParse(input);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    await updateReservation(id, {
      ...parsed.data,
      customerCompany: parsed.data.customerCompany,
      deliveryKm: parsed.data.deliveryKm ?? null,
    });
    revalidatePath("/pozicovna");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

// --- Manual blocks ---------------------------------------------------------

export async function createBlockAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = rentalBlockSchema.safeParse(input);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    await createBlock({ ...parsed.data, userId: user.id });
    revalidatePath("/pozicovna/kalendar");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteBlockAction(id: string): Promise<ActionResult> {
  try {
    await assertUser();
    await deleteBooking(id);
    revalidatePath("/pozicovna/kalendar");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

// --- Settings (super-admin) ------------------------------------------------

export async function saveRentalSettings(input: unknown): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const parsed = rentalSettingsSchema.safeParse(input);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error));
    const d = parsed.data;
    await prisma.rentalSettings.upsert({
      where: { id: "rental" },
      update: d,
      create: { id: "rental", ...d },
    });
    revalidatePath("/pozicovna/nastavenia");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function uploadPickupPhoto(formData: FormData): Promise<ActionResult<{ photos: string[] }>> {
  try {
    await assertSuperAdmin();
    const file = formData.get("image");
    if (!(file instanceof File)) return fail("Chýba súbor.");
    if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type))
      return fail("Nepodporovaný formát (PNG, JPG, WEBP, AVIF).");
    if (file.size > 5 * 1024 * 1024) return fail("Obrázok presahuje 5 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await uploadBlob(`rental/pickup/${file.name}`, buffer, file.type);
    const settings = await getRentalSettings();
    const photos = [
      ...((settings.pickupPhotos as unknown as { url: string; path: string }[]) ?? []),
      { url: blob.url, path: blob.pathname },
    ].slice(0, 8);
    await prisma.rentalSettings.update({ where: { id: "rental" }, data: { pickupPhotos: photos } });
    revalidatePath("/pozicovna/nastavenia");
    return ok({ photos: photos.map((p) => p.url) });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function uploadHeroImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await assertSuperAdmin();
    const file = formData.get("image");
    if (!(file instanceof File)) return fail("Chýba súbor.");
    if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type))
      return fail("Nepodporovaný formát (PNG, JPG, WEBP, AVIF).");
    if (file.size > 8 * 1024 * 1024) return fail("Obrázok presahuje 8 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await uploadBlob(`rental/hero/${file.name}`, buffer, file.type);
    const current = await getRentalSettings();
    if (current.heroImageUrl) await deleteBlob(current.heroImageUrl);
    await prisma.rentalSettings.update({
      where: { id: "rental" },
      data: { heroImageUrl: blob.url, heroImageBlobPath: blob.pathname },
    });
    revalidatePath("/pozicovna/nastavenia");
    return ok({ url: blob.url });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteHeroImage(): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const current = await getRentalSettings();
    if (current.heroImageUrl) await deleteBlob(current.heroImageUrl);
    await prisma.rentalSettings.update({
      where: { id: "rental" },
      data: { heroImageUrl: null, heroImageBlobPath: null },
    });
    revalidatePath("/pozicovna/nastavenia");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deletePickupPhoto(url: string): Promise<ActionResult<{ photos: string[] }>> {
  try {
    await assertSuperAdmin();
    const settings = await getRentalSettings();
    const photos = ((settings.pickupPhotos as unknown as { url: string; path: string }[]) ?? []).filter(
      (p) => p.url !== url,
    );
    await deleteBlob(url);
    await prisma.rentalSettings.update({ where: { id: "rental" }, data: { pickupPhotos: photos } });
    revalidatePath("/pozicovna/nastavenia");
    return ok({ photos: photos.map((p) => p.url) });
  } catch (e) {
    return fail(toSafeError(e));
  }
}
