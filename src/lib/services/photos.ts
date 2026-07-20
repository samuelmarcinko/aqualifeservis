import { prisma } from "@/lib/db";
import { uploadBlob, deleteBlob } from "./blob";
import { logActivity } from "./activity";
import {
  MAX_PHOTOS_PER_PROTOCOL,
  MAX_PHOTO_SIZE,
  ALLOWED_PHOTO_TYPES,
} from "@/lib/constants";
import type { PhotoCategory } from "@/generated/prisma";

export async function addProtocolPhoto(
  protocolId: string,
  file: File,
  userId: string,
): Promise<{ id: string }> {
  const protocol = await prisma.repairProtocol.findUniqueOrThrow({
    where: { id: protocolId },
    select: { locked: true, number: true, customerId: true, _count: { select: { photos: true } } },
  });
  if (protocol.locked) throw new Error("Dokument je uzamknutý.");
  if (protocol._count.photos >= MAX_PHOTOS_PER_PROTOCOL)
    throw new Error(`Maximálny počet fotografií je ${MAX_PHOTOS_PER_PROTOCOL}.`);

  if (!ALLOWED_PHOTO_TYPES.includes(file.type))
    throw new Error("Nepodporovaný formát. Povolené: JPG, PNG, WEBP.");
  if (file.size > MAX_PHOTO_SIZE) throw new Error("Fotografia presahuje 10 MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await uploadBlob(
    `protocols/${protocol.number}/photos/${file.name}`,
    buffer,
    file.type,
  );

  const maxPos = await prisma.protocolPhoto.aggregate({
    where: { protocolId },
    _max: { position: true },
  });

  const photo = await prisma.protocolPhoto.create({
    data: {
      protocolId,
      blobUrl: blob.url,
      blobPath: blob.pathname,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      category: "OTHER",
      position: (maxPos._max.position ?? 0) + 1,
      includeInPdf: true,
      uploadedById: userId,
    },
  });

  await logActivity({
    type: "PROTOCOL_PHOTO_UPLOADED",
    description: `Nahraná fotografia do protokolu ${protocol.number}`,
    customerId: protocol.customerId,
    documentType: "PROTOCOL",
    documentId: protocolId,
    documentNumber: protocol.number,
    actorId: userId,
  });

  return { id: photo.id };
}

export async function updateProtocolPhoto(
  photoId: string,
  patch: { category?: PhotoCategory; caption?: string; includeInPdf?: boolean },
) {
  await prisma.protocolPhoto.update({ where: { id: photoId }, data: patch });
}

export async function reorderProtocolPhotos(protocolId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.protocolPhoto.update({
        where: { id },
        data: { position: idx + 1 },
      }),
    ),
  );
}

export async function deleteProtocolPhoto(photoId: string, userId: string) {
  const photo = await prisma.protocolPhoto.findUniqueOrThrow({
    where: { id: photoId },
    include: { protocol: { select: { locked: true, number: true, customerId: true } } },
  });
  if (photo.protocol.locked) throw new Error("Dokument je uzamknutý.");
  await deleteBlob(photo.blobUrl);
  await prisma.protocolPhoto.delete({ where: { id: photoId } });
  await logActivity({
    type: "PROTOCOL_PHOTO_DELETED",
    description: `Odstránená fotografia z protokolu ${photo.protocol.number}`,
    customerId: photo.protocol.customerId,
    documentType: "PROTOCOL",
    documentId: photo.protocolId,
    documentNumber: photo.protocol.number,
    actorId: userId,
  });
}
