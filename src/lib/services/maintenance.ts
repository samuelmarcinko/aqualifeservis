import { prisma } from "@/lib/db";
import { deleteBlob } from "./blob";
import { logActivity } from "./activity";

/**
 * Destructive maintenance operations (SUPER_ADMIN only). Used to clear test
 * data. Blobs are cleaned up best-effort before rows are removed.
 */

export async function deleteAllQuotations(userId: string): Promise<number> {
  const stored = await prisma.storedDocument.findMany({ where: { type: "QUOTATION" } });
  for (const s of stored) await deleteBlob(s.blobUrl);

  const count = await prisma.quotation.count();
  await prisma.$transaction([
    prisma.quotation.deleteMany({}), // cascades items + revisions
    prisma.storedDocument.deleteMany({ where: { type: "QUOTATION" } }),
    prisma.emailLog.deleteMany({ where: { documentType: "QUOTATION" } }),
  ]);
  await logActivity({
    type: "MAINTENANCE_DELETE_ALL_QUOTATIONS",
    description: `Vymazané všetky cenové ponuky (${count})`,
    actorId: userId,
  });
  return count;
}

export async function deleteAllProtocols(userId: string): Promise<number> {
  const [stored, photos] = await Promise.all([
    prisma.storedDocument.findMany({ where: { type: "PROTOCOL" } }),
    prisma.protocolPhoto.findMany({ select: { blobUrl: true } }),
  ]);
  for (const s of stored) await deleteBlob(s.blobUrl);
  for (const p of photos) await deleteBlob(p.blobUrl);

  const count = await prisma.repairProtocol.count();
  await prisma.$transaction([
    prisma.repairProtocol.deleteMany({}), // cascades workItems + photos + revisions
    prisma.storedDocument.deleteMany({ where: { type: "PROTOCOL" } }),
    prisma.emailLog.deleteMany({ where: { documentType: "PROTOCOL" } }),
  ]);
  await logActivity({
    type: "MAINTENANCE_DELETE_ALL_PROTOCOLS",
    description: `Vymazané všetky protokoly (${count})`,
    actorId: userId,
  });
  return count;
}

/**
 * Reset document numbering back to 0001. Only allowed when no documents of the
 * given kind remain, to avoid duplicate historical numbers.
 */
export async function resetNumbering(userId: string): Promise<void> {
  const [quotations, protocols] = await Promise.all([
    prisma.quotation.count(),
    prisma.repairProtocol.count(),
  ]);
  if (quotations > 0 || protocols > 0) {
    throw new Error(
      "Číslovanie je možné vynulovať až po vymazaní všetkých cenových ponúk aj protokolov.",
    );
  }
  await prisma.documentSequence.deleteMany({});
  await logActivity({
    type: "MAINTENANCE_RESET_NUMBERING",
    description: "Vynulované číslovanie dokumentov",
    actorId: userId,
  });
}
