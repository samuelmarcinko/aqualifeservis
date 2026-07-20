"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertSuperAdmin } from "@/lib/session";
import { createUserSchema, setPasswordSchema } from "@/lib/validation";
import { ok, fail, toSafeError, type ActionResult } from "@/lib/action-result";
import { createUserAccount, setUserPassword } from "@/lib/services/users";
import { logActivity } from "@/lib/services/activity";
import type { UserRole } from "@/generated/prisma";

export async function createAdmin(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await assertSuperAdmin();
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const user = await createUserAccount(parsed.data);
    await logActivity({
      type: "USER_CREATED",
      description: `Vytvorený používateľ ${parsed.data.email}`,
      actorId: actor.id,
    });
    revalidatePath("/pouzivatelia");
    return ok({ id: user.id });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  try {
    const actor = await assertSuperAdmin();
    if (userId === actor.id && !active) return fail("Nemôžete deaktivovať vlastný účet.");
    await prisma.user.update({ where: { id: userId }, data: { active } });
    if (!active) await prisma.session.deleteMany({ where: { userId } });
    await logActivity({
      type: active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      description: `${active ? "Aktivovaný" : "Deaktivovaný"} používateľ`,
      actorId: actor.id,
    });
    revalidatePath("/pouzivatelia");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function changeUserRole(userId: string, role: string): Promise<ActionResult> {
  try {
    const actor = await assertSuperAdmin();
    if (userId === actor.id) return fail("Nemôžete zmeniť vlastnú rolu.");
    await prisma.user.update({ where: { id: userId }, data: { role: role as UserRole } });
    await logActivity({
      type: "USER_ROLE_CHANGED",
      description: `Zmenená rola používateľa na ${role}`,
      actorId: actor.id,
    });
    revalidatePath("/pouzivatelia");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function resetUserPassword(userId: string, input: unknown): Promise<ActionResult> {
  try {
    const actor = await assertSuperAdmin();
    const parsed = setPasswordSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte heslo.", parsed.error.flatten().fieldErrors);
    await setUserPassword(userId, parsed.data.password);
    await logActivity({
      type: "USER_PASSWORD_RESET",
      description: "Nastavené nové heslo používateľa",
      actorId: actor.id,
    });
    revalidatePath("/pouzivatelia");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}
