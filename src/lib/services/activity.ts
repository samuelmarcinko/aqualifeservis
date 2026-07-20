import type { Prisma, DocumentType } from "@/generated/prisma";
import { prisma } from "@/lib/db";

/**
 * Append-only activity / audit log.
 * Never store secrets, credentials, or auth tokens in metadata.
 */

export interface ActivityInput {
  type: string;
  description: string;
  customerId?: string | null;
  documentType?: DocumentType | null;
  documentId?: string | null;
  documentNumber?: string | null;
  actorId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

type Client = Prisma.TransactionClient | typeof prisma;

export async function logActivity(input: ActivityInput, client: Client = prisma): Promise<void> {
  await client.activityLog.create({
    data: {
      type: input.type,
      description: input.description,
      customerId: input.customerId ?? null,
      documentType: input.documentType ?? null,
      documentId: input.documentId ?? null,
      documentNumber: input.documentNumber ?? null,
      actorId: input.actorId ?? null,
      metadata: input.metadata,
    },
  });
}
