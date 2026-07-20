"use server";

import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/session";
import { protocolSchema, sendDocumentSchema } from "@/lib/validation";
import { ok, fail, toSafeError, type ActionResult } from "@/lib/action-result";
import {
  createProtocol,
  updateProtocol,
  finalizeProtocol,
  createProtocolRevision,
  changeProtocolStatus,
  sendProtocolEmail,
} from "@/lib/services/protocols";
import {
  updateProtocolPhoto,
  reorderProtocolPhotos,
  deleteProtocolPhoto,
} from "@/lib/services/photos";
import type { ProtocolStatus, PhotoCategory } from "@/generated/prisma";

export async function saveProtocol(input: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await assertUser();
    const parsed = protocolSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    if (id) {
      await updateProtocol(id, parsed.data, user.id);
      revalidatePath(`/protokoly/${id}`);
      return ok({ id });
    }
    const p = await createProtocol(parsed.data, user.id);
    revalidatePath("/protokoly");
    return ok({ id: p.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function finalizeProtocolAction(id: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await finalizeProtocol(id, user.id);
    revalidatePath(`/protokoly/${id}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function createProtocolRevisionAction(id: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await createProtocolRevision(id, user.id);
    revalidatePath(`/protokoly/${id}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function changeProtocolStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await changeProtocolStatus(id, status as ProtocolStatus, user.id);
    revalidatePath(`/protokoly/${id}`);
    revalidatePath("/protokoly");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function sendProtocolAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = sendDocumentSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const res = await sendProtocolEmail(id, parsed.data, user.id);
    if (!res.success) return fail(res.error ?? "Odoslanie zlyhalo.");
    revalidatePath(`/protokoly/${id}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

// --- Photos ---------------------------------------------------------------

export async function updatePhotoAction(
  protocolId: string,
  photoId: string,
  patch: { category?: string; caption?: string; includeInPdf?: boolean },
): Promise<ActionResult> {
  try {
    await assertUser();
    await updateProtocolPhoto(photoId, {
      category: patch.category as PhotoCategory | undefined,
      caption: patch.caption,
      includeInPdf: patch.includeInPdf,
    });
    revalidatePath(`/protokoly/${protocolId}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function reorderPhotosAction(protocolId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await assertUser();
    await reorderProtocolPhotos(protocolId, orderedIds);
    revalidatePath(`/protokoly/${protocolId}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deletePhotoAction(protocolId: string, photoId: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await deleteProtocolPhoto(photoId, user.id);
    revalidatePath(`/protokoly/${protocolId}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}
