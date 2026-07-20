"use server";

import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/session";
import { quotationSchema, sendDocumentSchema, zodErrorMessage } from "@/lib/validation";
import { ok, fail, toSafeError, type ActionResult } from "@/lib/action-result";
import {
  createQuotation,
  updateQuotation,
  finalizeQuotation,
  createQuotationRevision,
  changeQuotationStatus,
  sendQuotationEmail,
} from "@/lib/services/quotations";
import type { QuotationStatus } from "@/generated/prisma";

export async function saveQuotation(
  input: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await assertUser();
    const parsed = quotationSchema.safeParse(input);
    if (!parsed.success)
      return fail(zodErrorMessage(parsed.error), parsed.error.flatten().fieldErrors);
    if (id) {
      await updateQuotation(id, parsed.data, user.id);
      revalidatePath(`/cenove-ponuky/${id}`);
      return ok({ id });
    }
    const q = await createQuotation(parsed.data, user.id);
    revalidatePath("/cenove-ponuky");
    return ok({ id: q.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function finalizeQuotationAction(id: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await finalizeQuotation(id, user.id);
    revalidatePath(`/cenove-ponuky/${id}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function createRevisionAction(id: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await createQuotationRevision(id, user.id);
    revalidatePath(`/cenove-ponuky/${id}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function changeStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await changeQuotationStatus(id, status as QuotationStatus, user.id);
    revalidatePath(`/cenove-ponuky/${id}`);
    revalidatePath("/cenove-ponuky");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function sendQuotationAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = sendDocumentSchema.safeParse(input);
    if (!parsed.success)
      return fail(zodErrorMessage(parsed.error), parsed.error.flatten().fieldErrors);
    const res = await sendQuotationEmail(id, parsed.data, user.id);
    if (!res.success) return fail(res.error ?? "Odoslanie zlyhalo.");
    revalidatePath(`/cenove-ponuky/${id}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}
