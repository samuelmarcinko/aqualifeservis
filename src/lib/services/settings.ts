import { prisma } from "@/lib/db";
import type { CompanySettings, SmtpSettings } from "@/generated/prisma";
import {
  COMPANY_DEFAULTS,
  DEFAULT_PROTOCOL_EMAIL_BODY,
  DEFAULT_QUOTATION_EMAIL_BODY,
} from "@/lib/constants";

/** Get company settings, creating a seeded row on first access. */
export async function getCompanySettings(): Promise<CompanySettings> {
  const existing = await prisma.companySettings.findUnique({ where: { id: "company" } });
  if (existing) return existing;
  return prisma.companySettings.create({
    data: {
      id: "company",
      name: COMPANY_DEFAULTS.name,
      street: COMPANY_DEFAULTS.street,
      city: COMPANY_DEFAULTS.city,
      postalCode: COMPANY_DEFAULTS.postalCode,
      country: COMPANY_DEFAULTS.country,
      ico: COMPANY_DEFAULTS.ico,
      dic: COMPANY_DEFAULTS.dic,
      icDph: COMPANY_DEFAULTS.icDph,
      vatPayer: COMPANY_DEFAULTS.vatPayer,
      vatPayerSince: COMPANY_DEFAULTS.vatPayerSince,
      email: COMPANY_DEFAULTS.email,
      phone: COMPANY_DEFAULTS.phone,
      website: COMPANY_DEFAULTS.website,
      brandLight: COMPANY_DEFAULTS.brandLight,
      brandDark: COMPANY_DEFAULTS.brandDark,
      defaultVatRate: COMPANY_DEFAULTS.defaultVatRate,
      quotationValidityDays: COMPANY_DEFAULTS.quotationValidityDays,
      quotationEmailBody: DEFAULT_QUOTATION_EMAIL_BODY,
      protocolEmailBody: DEFAULT_PROTOCOL_EMAIL_BODY,
    },
  });
}

export async function getSmtpSettings(): Promise<SmtpSettings> {
  const existing = await prisma.smtpSettings.findUnique({ where: { id: "smtp" } });
  if (existing) return existing;
  return prisma.smtpSettings.create({ data: { id: "smtp" } });
}

/**
 * SMTP settings safe for the browser: password is masked, never returned.
 */
export function toSafeSmtp(smtp: SmtpSettings) {
  return {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    username: smtp.username,
    senderName: smtp.senderName,
    senderEmail: smtp.senderEmail,
    replyTo: smtp.replyTo,
    hasPassword: !!smtp.passwordEnc,
    passwordMasked: smtp.passwordEnc ? "••••••••" : "",
  };
}
