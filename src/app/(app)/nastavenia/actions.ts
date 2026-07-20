"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertSuperAdmin } from "@/lib/session";
import {
  companySettingsSchema,
  smtpSettingsSchema,
  testEmailSchema,
} from "@/lib/validation";
import { ok, fail, toSafeError, type ActionResult } from "@/lib/action-result";
import { encryptSecret } from "@/lib/services/crypto";
import { getCompanySettings, getSmtpSettings } from "@/lib/services/settings";
import { verifySmtp, sendMail } from "@/lib/services/email";
import { wrapEmailHtml } from "@/lib/services/email-templates";
import { uploadBlob, deleteBlob } from "@/lib/services/blob";
import { logActivity } from "@/lib/services/activity";

export async function saveCompanySettings(input: unknown): Promise<ActionResult> {
  try {
    const user = await assertSuperAdmin();
    const parsed = companySettingsSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const d = parsed.data;
    await prisma.companySettings.upsert({
      where: { id: "company" },
      update: { ...d, vatPayerSince: d.vatPayerSince ?? null },
      create: { id: "company", ...d, vatPayerSince: d.vatPayerSince ?? null },
    });
    await logActivity({ type: "SETTINGS_UPDATED", description: "Aktualizované firemné údaje", actorId: user.id });
    revalidatePath("/nastavenia");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function uploadLogo(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await assertSuperAdmin();
    const file = formData.get("logo");
    if (!(file instanceof File)) return fail("Chýba súbor.");
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type))
      return fail("Nepodporovaný formát loga.");
    if (file.size > 2 * 1024 * 1024) return fail("Logo presahuje 2 MB.");

    const current = await getCompanySettings();
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await uploadBlob(`branding/logo-${file.name}`, buffer, file.type);
    if (current.logoUrl) await deleteBlob(current.logoUrl);
    await prisma.companySettings.update({
      where: { id: "company" },
      data: { logoUrl: blob.url, logoBlobPath: blob.pathname },
    });
    revalidatePath("/nastavenia");
    return ok({ url: blob.url });
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function saveSmtpSettings(input: unknown): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const parsed = smtpSettingsSchema.safeParse(input);
    if (!parsed.success)
      return fail("Skontrolujte zadané údaje.", parsed.error.flatten().fieldErrors);
    const d = parsed.data;

    // Only overwrite the encrypted password if a new one was provided.
    const data: Record<string, unknown> = {
      host: d.host,
      port: d.port,
      secure: d.secure,
      username: d.username,
      senderName: d.senderName,
      senderEmail: d.senderEmail,
      replyTo: d.replyTo,
    };
    if (d.password && d.password.trim().length > 0) {
      data.passwordEnc = encryptSecret(d.password);
    }

    await prisma.smtpSettings.upsert({
      where: { id: "smtp" },
      update: data,
      create: { id: "smtp", ...data },
    });
    revalidatePath("/nastavenia");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function testSmtpConnection(): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const res = await verifySmtp();
    if (!res.ok) return fail(res.error ?? "Pripojenie zlyhalo.");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}

export async function sendTestEmail(input: unknown): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const parsed = testEmailSchema.safeParse(input);
    if (!parsed.success) return fail("Neplatný e-mail.");
    const company = await getCompanySettings();
    const html = wrapEmailHtml(
      company,
      "Toto je testovací e-mail z aplikácie AQUALIFE SERVIS – Evidencia.\n\nAk ste ho dostali, SMTP je nakonfigurované správne.",
      "Testovací e-mail",
    );
    const res = await sendMail({
      to: parsed.data.recipient,
      subject: "Testovací e-mail – AQUALIFE SERVIS",
      html,
      text: "Testovací e-mail z AQUALIFE SERVIS – Evidencia.",
    });
    if (!res.success) return fail(res.error ?? "Odoslanie zlyhalo.");
    return ok(null);
  } catch (e) {
    return fail(toSafeError(e));
  }
}
