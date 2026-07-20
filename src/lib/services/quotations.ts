import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import type { Quotation, QuotationItem, CompanySettings } from "@/generated/prisma";
import { computeLine, computeDocumentTotals, type LineInput } from "./money";
import { allocateDocumentNumber } from "./numbering";
import { getCompanySettings } from "./settings";
import { logActivity } from "./activity";
import { uploadBlob } from "./blob";
import { sendMail, fetchStoredPdf, logEmail } from "./email";
import { wrapEmailHtml } from "./email-templates";
import { renderQuotationPdf } from "@/lib/pdf/render";
import type { QuotationPdfData, PdfCompany } from "@/lib/pdf/types";
import { buildCustomerSnapshot, buildServiceAddressSnapshot } from "@/lib/snapshots";
import type { CustomerSnapshot, ServiceAddressSnapshot } from "@/lib/snapshots";
import type { QuotationInput } from "@/lib/validation";

export function companyToPdf(c: CompanySettings): PdfCompany {
  return {
    name: c.name,
    street: c.street,
    city: c.city,
    postalCode: c.postalCode,
    country: c.country,
    ico: c.ico,
    dic: c.dic,
    icDph: c.icDph,
    vatPayer: c.vatPayer,
    email: c.email,
    phone: c.phone,
    website: c.website,
    logoUrl: c.logoUrl,
    brandLight: c.brandLight,
    brandDark: c.brandDark,
  };
}

/** Recompute per-line and document totals from validated input. */
export function computeQuotation(input: QuotationInput) {
  const lines: LineInput[] = input.items.map((i) => ({
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    discountPct: i.discountPct,
    vatRate: i.vatRate,
  }));
  const totals = computeDocumentTotals(lines, input.taxMode, {
    type: input.documentDiscountType,
    value: input.documentDiscountValue,
  });
  const items = input.items.map((i, idx) => {
    const line = computeLine(
      { quantity: i.quantity, unitPrice: i.unitPrice, discountPct: i.discountPct, vatRate: i.vatRate },
      input.taxMode,
    );
    return {
      position: idx + 1,
      description: i.description,
      detail: i.detail ?? null,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      discountPct: i.discountPct,
      vatRate: input.taxMode === "STANDARD" ? i.vatRate : 0,
      catalogItemId: i.catalogItemId ?? null,
      lineNet: line.lineNet,
      lineVat: line.lineVat,
      lineGross: line.lineGross,
    };
  });
  return { totals, items };
}

async function loadSnapshots(customerId: string, serviceAddressId?: string | null) {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  const customerSnapshot = buildCustomerSnapshot(customer);
  let serviceAddressSnapshot: ServiceAddressSnapshot | null = null;
  if (serviceAddressId) {
    const addr = await prisma.customerServiceAddress.findUnique({ where: { id: serviceAddressId } });
    if (addr) serviceAddressSnapshot = buildServiceAddressSnapshot(addr);
  }
  return { customerSnapshot, serviceAddressSnapshot };
}

export async function createQuotation(input: QuotationInput, userId: string): Promise<Quotation> {
  const company = await getCompanySettings();
  const { totals, items } = computeQuotation(input);
  const { customerSnapshot, serviceAddressSnapshot } = await loadSnapshots(
    input.customerId,
    input.serviceAddressId,
  );

  const quotation = await prisma.$transaction(async (tx) => {
    const alloc = await allocateDocumentNumber(tx, "QUOTATION", company.quotationPrefix);
    const created = await tx.quotation.create({
      data: {
        number: alloc.number,
        year: alloc.year,
        seq: alloc.seq,
        revision: 1,
        status: "DRAFT",
        customerId: input.customerId,
        customerSnapshot: customerSnapshot as unknown as Prisma.InputJsonValue,
        serviceAddressSnapshot: serviceAddressSnapshot
          ? (serviceAddressSnapshot as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        issueDate: input.issueDate,
        validUntil: input.validUntil,
        taxMode: input.taxMode,
        noVatNote: input.noVatNote,
        documentDiscountType: input.documentDiscountType,
        documentDiscountValue: input.documentDiscountValue,
        internalNote: input.internalNote,
        customerNote: input.customerNote,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxBase: totals.taxBase,
        vatTotal: totals.vatTotal,
        grandTotal: totals.grandTotal,
        vatBreakdown: totals.vatBreakdown.map((v) => ({
          rate: v.rate,
          base: v.base.toString(),
          vat: v.vat.toString(),
        })) as unknown as Prisma.InputJsonValue,
        createdById: userId,
        updatedById: userId,
        items: { create: items },
      },
    });
    await incrementCatalogUsage(tx, items);
    return created;
  });

  await logActivity({
    type: "QUOTATION_CREATED",
    description: `Vytvorená cenová ponuka ${quotation.number}`,
    customerId: input.customerId,
    documentType: "QUOTATION",
    documentId: quotation.id,
    documentNumber: quotation.number,
    actorId: userId,
  });
  return quotation;
}

export async function updateQuotation(id: string, input: QuotationInput, userId: string) {
  const existing = await prisma.quotation.findUniqueOrThrow({ where: { id } });
  if (existing.locked) throw new Error("Dokument je uzamknutý. Vytvorte novú revíziu.");

  const { totals, items } = computeQuotation(input);
  const { customerSnapshot, serviceAddressSnapshot } = await loadSnapshots(
    input.customerId,
    input.serviceAddressId,
  );

  await prisma.$transaction(async (tx) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });
    await tx.quotation.update({
      where: { id },
      data: {
        customerId: input.customerId,
        customerSnapshot: customerSnapshot as unknown as Prisma.InputJsonValue,
        serviceAddressSnapshot: serviceAddressSnapshot
          ? (serviceAddressSnapshot as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        issueDate: input.issueDate,
        validUntil: input.validUntil,
        taxMode: input.taxMode,
        noVatNote: input.noVatNote,
        documentDiscountType: input.documentDiscountType,
        documentDiscountValue: input.documentDiscountValue,
        internalNote: input.internalNote,
        customerNote: input.customerNote,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxBase: totals.taxBase,
        vatTotal: totals.vatTotal,
        grandTotal: totals.grandTotal,
        vatBreakdown: totals.vatBreakdown.map((v) => ({
          rate: v.rate,
          base: v.base.toString(),
          vat: v.vat.toString(),
        })) as unknown as Prisma.InputJsonValue,
        updatedById: userId,
        items: { create: items },
      },
    });
    await incrementCatalogUsage(tx, items);
  });

  await logActivity({
    type: "QUOTATION_UPDATED",
    description: `Upravená cenová ponuka ${existing.number}`,
    customerId: input.customerId,
    documentType: "QUOTATION",
    documentId: id,
    documentNumber: existing.number,
    actorId: userId,
  });
}

async function incrementCatalogUsage(
  tx: Prisma.TransactionClient,
  items: { catalogItemId: string | null }[],
) {
  const ids = items.map((i) => i.catalogItemId).filter((v): v is string => !!v);
  if (ids.length === 0) return;
  await tx.catalogItem.updateMany({ where: { id: { in: ids } }, data: { usageCount: { increment: 1 } } });
}

/** Build the PDF data object for a quotation (used for preview and finalize). */
export function buildQuotationPdfData(
  q: Quotation & { items: QuotationItem[] },
  company: CompanySettings,
): QuotationPdfData {
  const snap = q.customerSnapshot as unknown as CustomerSnapshot;
  const addr = q.serviceAddressSnapshot as unknown as ServiceAddressSnapshot | null;
  const vb = (q.vatBreakdown as unknown as { rate: string; base: string; vat: string }[]) ?? [];
  return {
    company: companyToPdf(company),
    number: q.number,
    revision: q.revision,
    issueDate: q.issueDate.toISOString(),
    validUntil: q.validUntil.toISOString(),
    taxMode: q.taxMode,
    noVatNote: q.noVatNote,
    customer: {
      typeLabel: snap.typeLabel,
      displayName: snap.displayName,
      contactPerson: snap.contactPerson,
      ico: snap.ico,
      dic: snap.dic,
      icDph: snap.icDph,
      email: snap.email,
      phone: snap.phone,
      street: snap.street,
      city: snap.city,
      postalCode: snap.postalCode,
      country: snap.country,
    },
    serviceAddress: addr
      ? {
          label: addr.label,
          street: addr.street,
          city: addr.city,
          postalCode: addr.postalCode,
          country: addr.country,
          objectType: addr.objectType,
          apartment: addr.apartment,
        }
      : null,
    items: q.items
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        position: i.position,
        description: i.description,
        detail: i.detail,
        quantity: i.quantity.toString(),
        unit: i.unit,
        unitPrice: i.unitPrice.toString(),
        discountPct: i.discountPct.toString(),
        vatRate: i.vatRate.toString(),
        lineNet: i.lineNet.toString(),
      })),
    subtotal: q.subtotal.toString(),
    discountTotal: q.discountTotal.toString(),
    taxBase: q.taxBase.toString(),
    vatBreakdown: vb,
    vatTotal: q.vatTotal.toString(),
    grandTotal: q.grandTotal.toString(),
    customerNote: q.customerNote,
  };
}

export async function generateQuotationPreview(id: string): Promise<Buffer> {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id }, include: { items: true } });
  const company = await getCompanySettings();
  return renderQuotationPdf(buildQuotationPdfData(q, company));
}

/** Finalize: snapshot + stored PDF + lock. Idempotent per revision. */
export async function finalizeQuotation(id: string, userId: string) {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id }, include: { items: true } });
  const company = await getCompanySettings();
  const data = buildQuotationPdfData(q, company);
  const pdf = await renderQuotationPdf(data);
  const fileName = `${q.number}-rev${q.revision}.pdf`;

  const existingRev = await prisma.quotationRevision.findUnique({
    where: { quotationId_revision: { quotationId: id, revision: q.revision } },
  });

  const blob = await uploadBlob(`quotations/${q.number}/${fileName}`, pdf, "application/pdf");

  await prisma.$transaction(async (tx) => {
    const stored = await tx.storedDocument.create({
      data: {
        type: "QUOTATION",
        documentNumber: q.number,
        revision: q.revision,
        blobUrl: blob.url,
        blobPath: blob.pathname,
        fileName,
        size: pdf.length,
        createdById: userId,
      },
    });
    if (existingRev) {
      await tx.quotationRevision.update({
        where: { id: existingRev.id },
        data: { snapshot: data as unknown as Prisma.InputJsonValue, storedDocumentId: stored.id },
      });
    } else {
      await tx.quotationRevision.create({
        data: {
          quotationId: id,
          revision: q.revision,
          snapshot: data as unknown as Prisma.InputJsonValue,
          storedDocumentId: stored.id,
          createdById: userId,
        },
      });
    }
    await tx.quotation.update({
      where: { id },
      data: {
        locked: true,
        status: q.status === "DRAFT" ? "READY" : q.status,
        finalizedAt: new Date(),
        updatedById: userId,
      },
    });
  });

  await logActivity({
    type: "QUOTATION_FINALIZED",
    description: `Finalizovaná cenová ponuka ${q.number} (rev. ${q.revision})`,
    customerId: q.customerId,
    documentType: "QUOTATION",
    documentId: id,
    documentNumber: q.number,
    actorId: userId,
  });
}

export async function createQuotationRevision(id: string, userId: string) {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id } });
  if (!q.locked) throw new Error("Revíziu je možné vytvoriť len z uzamknutého dokumentu.");
  const newRevision = q.revision + 1;
  await prisma.quotation.update({
    where: { id },
    data: {
      revision: newRevision,
      locked: false,
      status: "DRAFT",
      finalizedAt: null,
      sentAt: null,
      updatedById: userId,
    },
  });
  await logActivity({
    type: "QUOTATION_REVISION_CREATED",
    description: `Vytvorená nová revízia cenovej ponuky ${q.number} (rev. ${newRevision})`,
    customerId: q.customerId,
    documentType: "QUOTATION",
    documentId: id,
    documentNumber: q.number,
    actorId: userId,
    metadata: { revision: newRevision },
  });
}

export async function changeQuotationStatus(
  id: string,
  status: Quotation["status"],
  userId: string,
) {
  const q = await prisma.quotation.update({ where: { id }, data: { status, updatedById: userId } });
  await logActivity({
    type: "QUOTATION_STATUS_CHANGED",
    description: `Zmena stavu cenovej ponuky ${q.number}`,
    customerId: q.customerId,
    documentType: "QUOTATION",
    documentId: id,
    documentNumber: q.number,
    actorId: userId,
    metadata: { status },
  });
  return q;
}

export interface SendQuotationInput {
  recipient: string;
  subject: string;
  message: string;
  revision: number;
}

export async function sendQuotationEmail(
  id: string,
  input: SendQuotationInput,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id } });

  // Ensure the requested revision has a stored PDF; finalize current if needed.
  if (input.revision === q.revision && !q.locked) {
    await finalizeQuotation(id, userId);
  }
  const revision = await prisma.quotationRevision.findUnique({
    where: { quotationId_revision: { quotationId: id, revision: input.revision } },
    include: { storedDocument: true },
  });
  if (!revision?.storedDocument) throw new Error("Pre zvolenú revíziu neexistuje uložený PDF.");

  const company = await getCompanySettings();
  const pdf = await fetchStoredPdf(revision.storedDocument.blobUrl);
  const html = wrapEmailHtml(company, input.message, `Cenová ponuka č. ${q.number}`);

  const result = await sendMail({
    to: input.recipient,
    subject: input.subject,
    html,
    text: input.message,
    attachments: [
      { filename: revision.storedDocument.fileName, content: pdf, contentType: "application/pdf" },
    ],
  });

  await logEmail({
    documentType: "QUOTATION",
    documentId: id,
    documentNumber: q.number,
    revision: input.revision,
    recipient: input.recipient,
    subject: input.subject,
    senderId: userId,
    success: result.success,
    errorMessage: result.error,
    messageId: result.messageId,
    storedDocumentId: revision.storedDocument.id,
  });

  if (result.success) {
    await prisma.quotation.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), locked: true },
    });
    await logActivity({
      type: "QUOTATION_SENT",
      description: `Cenová ponuka ${q.number} odoslaná na ${input.recipient}`,
      customerId: q.customerId,
      documentType: "QUOTATION",
      documentId: id,
      documentNumber: q.number,
      actorId: userId,
      metadata: { recipient: input.recipient, revision: input.revision },
    });
  }
  return { success: result.success, error: result.error };
}

/** Derive the display status, marking overdue quotations as EXPIRED. */
export function effectiveQuotationStatus(q: {
  status: string;
  validUntil: Date | string;
}): string {
  const open = ["DRAFT", "READY", "SENT"];
  if (open.includes(q.status)) {
    const due = new Date(q.validUntil);
    if (due.getTime() < Date.now()) return "EXPIRED";
  }
  return q.status;
}
