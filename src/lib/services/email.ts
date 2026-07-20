import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "@/lib/db";
import { getSmtpSettings } from "./settings";
import { decryptSecret } from "./crypto";
import type { SmtpSettings } from "@/generated/prisma";

export interface SmtpOverride {
  host?: string | null;
  port?: number;
  secure?: boolean;
  username?: string | null;
  password?: string | null; // plaintext, from a live edit
  senderName?: string;
  senderEmail?: string;
  replyTo?: string | null;
}

function buildTransporter(smtp: SmtpSettings, plaintextPassword?: string | null): Transporter {
  if (!smtp.host) throw new Error("SMTP server nie je nakonfigurovaný.");
  const password =
    plaintextPassword ?? (smtp.passwordEnc ? decryptSecret(smtp.passwordEnc) : undefined);
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.username ? { user: smtp.username, pass: password } : undefined,
  });
}

export async function verifySmtp(override?: SmtpOverride): Promise<{ ok: boolean; error?: string }> {
  try {
    const smtp = await getSmtpSettings();
    const merged: SmtpSettings = { ...smtp, ...sanitizeOverride(override, smtp) };
    const transporter = buildTransporter(merged, override?.password ?? undefined);
    await transporter.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Neznáma chyba" };
  }
}

function sanitizeOverride(o: SmtpOverride | undefined, base: SmtpSettings): Partial<SmtpSettings> {
  if (!o) return {};
  return {
    host: o.host ?? base.host,
    port: o.port ?? base.port,
    secure: o.secure ?? base.secure,
    username: o.username ?? base.username,
    senderName: o.senderName ?? base.senderName,
    senderEmail: o.senderEmail ?? base.senderEmail,
    replyTo: o.replyTo ?? base.replyTo,
  };
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}): Promise<SendResult> {
  const smtp = await getSmtpSettings();
  const transporter = buildTransporter(smtp);
  try {
    const info = await transporter.sendMail({
      from: `"${smtp.senderName}" <${smtp.senderEmail}>`,
      replyTo: smtp.replyTo ?? smtp.senderEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments,
    });
    return { success: true, messageId: info.messageId };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Odoslanie zlyhalo" };
  }
}

/** Fetch a stored PDF from Blob for use as an attachment. */
export async function fetchStoredPdf(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Uložený PDF sa nepodarilo načítať.");
  return Buffer.from(await res.arrayBuffer());
}

export async function logEmail(entry: {
  documentType: "QUOTATION" | "PROTOCOL";
  documentId: string;
  documentNumber: string;
  revision: number;
  recipient: string;
  subject: string;
  senderId: string;
  success: boolean;
  errorMessage?: string;
  messageId?: string;
  storedDocumentId?: string;
}) {
  await prisma.emailLog.create({
    data: {
      documentType: entry.documentType,
      documentId: entry.documentId,
      documentNumber: entry.documentNumber,
      revision: entry.revision,
      recipient: entry.recipient,
      subject: entry.subject,
      senderId: entry.senderId,
      success: entry.success,
      errorMessage: entry.errorMessage,
      messageId: entry.messageId,
      storedDocumentId: entry.storedDocumentId,
    },
  });
}
