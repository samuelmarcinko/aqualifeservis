import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import type { RepairProtocol, ProtocolWorkItem, ProtocolPhoto, CompanySettings } from "@/generated/prisma";
import { allocateDocumentNumber } from "./numbering";
import { getCompanySettings } from "./settings";
import { logActivity } from "./activity";
import { uploadBlob, deleteBlob } from "./blob";
import { sendMail, fetchStoredPdf, logEmail } from "./email";
import { wrapEmailHtml } from "./email-templates";
import { renderProtocolPdf } from "@/lib/pdf/render";
import { companyToPdf } from "./quotations";
import type { ProtocolPdfData } from "@/lib/pdf/types";
import { buildCustomerSnapshot, buildServiceAddressSnapshot } from "@/lib/snapshots";
import type { CustomerSnapshot, ServiceAddressSnapshot } from "@/lib/snapshots";
import { PHOTO_CATEGORY_LABELS } from "@/lib/constants";
import type { ProtocolInput } from "@/lib/validation";

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

function mapCommon(input: ProtocolInput) {
  return {
    insuranceEventNumber: input.insuranceEventNumber,
    documentDate: input.documentDate,
    faultDate: input.faultDate ?? null,
    repairDate: input.repairDate ?? null,
    objectStreet: input.objectStreet,
    objectCity: input.objectCity,
    objectPostalCode: input.objectPostalCode,
    objectType: input.objectType,
    objectApartment: input.objectApartment,
    insuranceContractNumber: input.insuranceContractNumber,
    insurer: input.insurer,
    objectNote: input.objectNote,
    faultType: input.faultType,
    faultCause: input.faultCause,
    faultDescription: input.faultDescription,
    damageExtent: input.damageExtent,
    technicianStatement: input.technicianStatement,
    notes: input.notes,
    recommendations: input.recommendations,
  };
}

export async function createProtocol(input: ProtocolInput, userId: string): Promise<RepairProtocol> {
  const company = await getCompanySettings();
  const { customerSnapshot, serviceAddressSnapshot } = await loadSnapshots(
    input.customerId,
    input.serviceAddressId,
  );

  const protocol = await prisma.$transaction(async (tx) => {
    const alloc = await allocateDocumentNumber(tx, "PROTOCOL", company.protocolPrefix);
    return tx.repairProtocol.create({
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
        ...mapCommon(input),
        createdById: userId,
        updatedById: userId,
        workItems: {
          create: input.workItems.map((w, idx) => ({
            position: idx + 1,
            description: w.description,
            quantity: w.quantity ?? null,
            unit: w.unit ?? null,
            internalNote: w.internalNote ?? null,
            catalogItemId: w.catalogItemId ?? null,
          })),
        },
      },
    });
  });

  await logActivity({
    type: "PROTOCOL_CREATED",
    description: `Vytvorený protokol o oprave ${protocol.number}`,
    customerId: input.customerId,
    documentType: "PROTOCOL",
    documentId: protocol.id,
    documentNumber: protocol.number,
    actorId: userId,
  });
  return protocol;
}

export async function updateProtocol(id: string, input: ProtocolInput, userId: string) {
  const existing = await prisma.repairProtocol.findUniqueOrThrow({ where: { id } });
  if (existing.locked) throw new Error("Dokument je uzamknutý. Vytvorte novú revíziu.");

  const { customerSnapshot, serviceAddressSnapshot } = await loadSnapshots(
    input.customerId,
    input.serviceAddressId,
  );

  await prisma.$transaction(async (tx) => {
    await tx.protocolWorkItem.deleteMany({ where: { protocolId: id } });
    await tx.repairProtocol.update({
      where: { id },
      data: {
        customerId: input.customerId,
        customerSnapshot: customerSnapshot as unknown as Prisma.InputJsonValue,
        serviceAddressSnapshot: serviceAddressSnapshot
          ? (serviceAddressSnapshot as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ...mapCommon(input),
        updatedById: userId,
        workItems: {
          create: input.workItems.map((w, idx) => ({
            position: idx + 1,
            description: w.description,
            quantity: w.quantity ?? null,
            unit: w.unit ?? null,
            internalNote: w.internalNote ?? null,
            catalogItemId: w.catalogItemId ?? null,
          })),
        },
      },
    });
  });

  await logActivity({
    type: "PROTOCOL_UPDATED",
    description: `Upravený protokol o oprave ${existing.number}`,
    customerId: input.customerId,
    documentType: "PROTOCOL",
    documentId: id,
    documentNumber: existing.number,
    actorId: userId,
  });
}

export function buildProtocolPdfData(
  p: RepairProtocol & { workItems: ProtocolWorkItem[]; photos: ProtocolPhoto[] },
  company: CompanySettings,
  signedAt?: Date | null,
): ProtocolPdfData {
  const snap = p.customerSnapshot as unknown as CustomerSnapshot;
  const addr = p.serviceAddressSnapshot as unknown as ServiceAddressSnapshot | null;
  return {
    company: companyToPdf(company),
    number: p.number,
    revision: p.revision,
    signedAt: signedAt ? signedAt.toISOString() : null,
    insuranceEventNumber: p.insuranceEventNumber,
    documentDate: p.documentDate.toISOString(),
    faultDate: p.faultDate?.toISOString() ?? null,
    repairDate: p.repairDate?.toISOString() ?? null,
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
    objectStreet: p.objectStreet,
    objectCity: p.objectCity,
    objectPostalCode: p.objectPostalCode,
    objectType: p.objectType,
    objectApartment: p.objectApartment,
    insuranceContractNumber: p.insuranceContractNumber,
    insurer: p.insurer,
    objectNote: p.objectNote,
    faultType: p.faultType,
    faultCause: p.faultCause,
    faultDescription: p.faultDescription,
    damageExtent: p.damageExtent,
    workItems: p.workItems
      .sort((a, b) => a.position - b.position)
      .map((w) => ({
        position: w.position,
        description: w.description,
        quantity: w.quantity ? w.quantity.toString() : null,
        unit: w.unit,
      })),
    technicianStatement: p.technicianStatement,
    notes: p.notes,
    recommendations: p.recommendations,
    photos: p.photos
      .filter((ph) => ph.includeInPdf)
      .sort((a, b) => a.position - b.position)
      .map((ph) => ({
        url: ph.blobUrl,
        caption: ph.caption,
        categoryLabel: PHOTO_CATEGORY_LABELS[ph.category] ?? "Ostatné",
      })),
  };
}

export async function generateProtocolPreview(id: string): Promise<Buffer> {
  const p = await prisma.repairProtocol.findUniqueOrThrow({
    where: { id },
    include: { workItems: true, photos: true },
  });
  const company = await getCompanySettings();
  return renderProtocolPdf(buildProtocolPdfData(p, company));
}

export async function finalizeProtocol(id: string, userId: string) {
  const p = await prisma.repairProtocol.findUniqueOrThrow({
    where: { id },
    include: { workItems: true, photos: true },
  });
  const company = await getCompanySettings();
  const signedAt = new Date();
  const data = buildProtocolPdfData(p, company, signedAt);
  const pdf = await renderProtocolPdf(data);
  const fileName = `${p.number}-rev${p.revision}.pdf`;

  const existingRev = await prisma.repairProtocolRevision.findUnique({
    where: { protocolId_revision: { protocolId: id, revision: p.revision } },
  });
  const blob = await uploadBlob(`protocols/${p.number}/${fileName}`, pdf, "application/pdf");

  await prisma.$transaction(async (tx) => {
    const stored = await tx.storedDocument.create({
      data: {
        type: "PROTOCOL",
        documentNumber: p.number,
        revision: p.revision,
        blobUrl: blob.url,
        blobPath: blob.pathname,
        fileName,
        size: pdf.length,
        createdById: userId,
      },
    });
    if (existingRev) {
      await tx.repairProtocolRevision.update({
        where: { id: existingRev.id },
        data: { snapshot: data as unknown as Prisma.InputJsonValue, storedDocumentId: stored.id },
      });
    } else {
      await tx.repairProtocolRevision.create({
        data: {
          protocolId: id,
          revision: p.revision,
          snapshot: data as unknown as Prisma.InputJsonValue,
          storedDocumentId: stored.id,
          createdById: userId,
        },
      });
    }
    await tx.repairProtocol.update({
      where: { id },
      data: {
        locked: true,
        status: p.status === "DRAFT" ? "FINAL" : p.status,
        finalizedAt: signedAt,
        updatedById: userId,
      },
    });
  });

  await logActivity({
    type: "PROTOCOL_FINALIZED",
    description: `Finalizovaný protokol ${p.number} (rev. ${p.revision})`,
    customerId: p.customerId,
    documentType: "PROTOCOL",
    documentId: id,
    documentNumber: p.number,
    actorId: userId,
  });
}

export async function createProtocolRevision(id: string, userId: string) {
  const p = await prisma.repairProtocol.findUniqueOrThrow({ where: { id } });
  if (!p.locked) throw new Error("Revíziu je možné vytvoriť len z uzamknutého dokumentu.");
  const newRevision = p.revision + 1;
  await prisma.repairProtocol.update({
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
    type: "PROTOCOL_REVISION_CREATED",
    description: `Vytvorená nová revízia protokolu ${p.number} (rev. ${newRevision})`,
    customerId: p.customerId,
    documentType: "PROTOCOL",
    documentId: id,
    documentNumber: p.number,
    actorId: userId,
    metadata: { revision: newRevision },
  });
}

export async function changeProtocolStatus(id: string, status: RepairProtocol["status"], userId: string) {
  const p = await prisma.repairProtocol.update({ where: { id }, data: { status, updatedById: userId } });
  await logActivity({
    type: "PROTOCOL_STATUS_CHANGED",
    description: `Zmena stavu protokolu ${p.number}`,
    customerId: p.customerId,
    documentType: "PROTOCOL",
    documentId: id,
    documentNumber: p.number,
    actorId: userId,
    metadata: { status },
  });
  return p;
}

/** Permanently delete a protocol, its revisions, photos, stored PDFs and email logs (blobs incl.). */
export async function deleteProtocol(id: string, userId: string) {
  const p = await prisma.repairProtocol.findUniqueOrThrow({
    where: { id },
    include: { revisions: { include: { storedDocument: true } }, photos: true },
  });

  for (const rev of p.revisions) {
    if (rev.storedDocument) await deleteBlob(rev.storedDocument.blobUrl);
  }
  for (const photo of p.photos) await deleteBlob(photo.blobUrl);

  const storedIds = p.revisions
    .map((r) => r.storedDocumentId)
    .filter((v): v is string => !!v);

  await prisma.$transaction(async (tx) => {
    await tx.repairProtocol.delete({ where: { id } }); // cascades workItems + photos + revisions
    if (storedIds.length) await tx.storedDocument.deleteMany({ where: { id: { in: storedIds } } });
    await tx.emailLog.deleteMany({ where: { documentType: "PROTOCOL", documentId: id } });
  });

  await logActivity({
    type: "PROTOCOL_DELETED",
    description: `Vymazaný protokol ${p.number}`,
    customerId: p.customerId,
    actorId: userId,
  });
}

export async function deleteProtocols(ids: string[], userId: string) {
  for (const id of ids) await deleteProtocol(id, userId);
}

export interface SendProtocolInput {
  recipient: string;
  subject: string;
  message: string;
  revision: number;
}

export async function sendProtocolEmail(id: string, input: SendProtocolInput, userId: string) {
  const p = await prisma.repairProtocol.findUniqueOrThrow({ where: { id } });
  if (input.revision === p.revision && !p.locked) {
    await finalizeProtocol(id, userId);
  }
  const revision = await prisma.repairProtocolRevision.findUnique({
    where: { protocolId_revision: { protocolId: id, revision: input.revision } },
    include: { storedDocument: true },
  });
  if (!revision?.storedDocument) throw new Error("Pre zvolenú revíziu neexistuje uložený PDF.");

  const company = await getCompanySettings();
  const pdf = await fetchStoredPdf(revision.storedDocument.blobUrl);
  const html = wrapEmailHtml(company, input.message, `Protokol o oprave č. ${p.number}`);

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
    documentType: "PROTOCOL",
    documentId: id,
    documentNumber: p.number,
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
    await prisma.repairProtocol.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), locked: true },
    });
    await logActivity({
      type: "PROTOCOL_SENT",
      description: `Protokol ${p.number} odoslaný na ${input.recipient}`,
      customerId: p.customerId,
      documentType: "PROTOCOL",
      documentId: id,
      documentNumber: p.number,
      actorId: userId,
      metadata: { recipient: input.recipient, revision: input.revision },
    });
  }
  return { success: result.success, error: result.error };
}
