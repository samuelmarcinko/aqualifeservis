"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/session";
import { logActivity } from "@/lib/services/activity";
import { customerDisplayName } from "@/lib/snapshots";
import {
  customerSchema,
  serviceAddressSchema,
  customerNoteSchema,
} from "@/lib/validation";
import { ok, fail, toSafeError, type ActionResult } from "@/lib/action-result";

export async function createCustomer(
  input: unknown,
  address?: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await assertUser();
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const d = parsed.data;

    const customer = await prisma.customer.create({
      data: {
        type: d.type,
        firstName: d.firstName,
        lastName: d.lastName,
        businessName: d.businessName,
        contactPerson: d.contactPerson,
        ico: d.ico,
        dic: d.dic,
        icDph: d.icDph,
        vatPayer: d.vatPayer,
        email: d.email,
        phone: d.phone,
        phoneSecondary: d.phoneSecondary,
        street: d.street,
        city: d.city,
        postalCode: d.postalCode,
        country: d.country,
        internalNote: d.internalNote,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await logActivity({
      type: "CUSTOMER_CREATED",
      description: `Vytvorený zákazník ${customerDisplayName(customer)}`,
      customerId: customer.id,
      actorId: user.id,
    });

    // Optional first service address created together with the customer.
    const addrObj = address as { label?: string } | undefined;
    if (addrObj && typeof addrObj.label === "string" && addrObj.label.trim()) {
      const addrParsed = serviceAddressSchema.safeParse(address);
      if (addrParsed.success) {
        await prisma.customerServiceAddress.create({
          data: { ...addrParsed.data, isDefault: true, customerId: customer.id },
        });
        await logActivity({
          type: "SERVICE_ADDRESS_CREATED",
          description: `Pridaná servisná adresa „${addrParsed.data.label}“`,
          customerId: customer.id,
          actorId: user.id,
        });
      }
    }

    revalidatePath("/zakaznici");
    return ok({ id: customer.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function updateCustomer(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await assertUser();
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const d = parsed.data;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        type: d.type,
        firstName: d.firstName,
        lastName: d.lastName,
        businessName: d.businessName,
        contactPerson: d.contactPerson,
        ico: d.ico,
        dic: d.dic,
        icDph: d.icDph,
        vatPayer: d.vatPayer,
        email: d.email,
        phone: d.phone,
        phoneSecondary: d.phoneSecondary,
        street: d.street,
        city: d.city,
        postalCode: d.postalCode,
        country: d.country,
        internalNote: d.internalNote,
        updatedById: user.id,
      },
    });

    await logActivity({
      type: "CUSTOMER_UPDATED",
      description: `Upravený zákazník ${customerDisplayName(customer)}`,
      customerId: customer.id,
      actorId: user.id,
    });

    revalidatePath("/zakaznici");
    revalidatePath(`/zakaznici/${id}`);
    return ok({ id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function archiveCustomer(id: string, archive: boolean): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const customer = await prisma.customer.update({
      where: { id },
      data: { archivedAt: archive ? new Date() : null, updatedById: user.id },
    });
    await logActivity({
      type: archive ? "CUSTOMER_ARCHIVED" : "CUSTOMER_RESTORED",
      description: `${archive ? "Archivovaný" : "Obnovený"} zákazník ${customerDisplayName(customer)}`,
      customerId: id,
      actorId: user.id,
    });
    revalidatePath("/zakaznici");
    revalidatePath(`/zakaznici/${id}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

// --- Service addresses -----------------------------------------------------

export async function saveServiceAddress(
  customerId: string,
  input: unknown,
  addressId?: string,
): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = serviceAddressSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const d = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (d.isDefault) {
        await tx.customerServiceAddress.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }
      if (addressId) {
        await tx.customerServiceAddress.update({ where: { id: addressId }, data: d });
      } else {
        await tx.customerServiceAddress.create({ data: { ...d, customerId } });
      }
    });

    await logActivity({
      type: addressId ? "SERVICE_ADDRESS_UPDATED" : "SERVICE_ADDRESS_CREATED",
      description: `${addressId ? "Upravená" : "Pridaná"} servisná adresa „${d.label}“`,
      customerId,
      actorId: user.id,
    });

    revalidatePath(`/zakaznici/${customerId}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function deleteServiceAddress(
  customerId: string,
  addressId: string,
): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await prisma.customerServiceAddress.delete({ where: { id: addressId } });
    await logActivity({
      type: "SERVICE_ADDRESS_DELETED",
      description: "Odstránená servisná adresa",
      customerId,
      actorId: user.id,
    });
    revalidatePath(`/zakaznici/${customerId}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

// --- Notes -----------------------------------------------------------------

export async function addCustomerNote(customerId: string, input: unknown): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = customerNoteSchema.safeParse(input);
    if (!parsed.success) return fail("Poznámka nemôže byť prázdna.");
    await prisma.customerNote.create({
      data: { customerId, body: parsed.data.body, createdById: user.id },
    });
    await logActivity({
      type: "CUSTOMER_NOTE_ADDED",
      description: "Pridaná interná poznámka",
      customerId,
      actorId: user.id,
    });
    revalidatePath(`/zakaznici/${customerId}`);
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}
