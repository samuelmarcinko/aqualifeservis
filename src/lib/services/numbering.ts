import { randomUUID } from "node:crypto";
import type { Prisma, SequenceKind } from "@/generated/prisma";

/**
 * Concurrency-safe document numbering.
 *
 * Numbers reset to 0001 every calendar year. Allocation uses a single atomic
 * Postgres `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` against a
 * per-(kind, year) sequence row, so two concurrent transactions can never
 * receive the same number. A unique constraint on the document `number` column
 * is the final backstop.
 */

/** Pure formatter: CP-2026-0001 */
export function formatDocumentNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export interface AllocatedNumber {
  number: string;
  year: number;
  seq: number;
}

/**
 * Atomically allocate the next sequence value for the given kind/year.
 * MUST be called inside a transaction alongside the document insert.
 */
export async function allocateDocumentNumber(
  tx: Prisma.TransactionClient,
  kind: SequenceKind,
  prefix: string,
  now: Date = new Date(),
): Promise<AllocatedNumber> {
  // Year in Europe/Bratislava timezone.
  const year = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Bratislava",
      year: "numeric",
    }).format(now),
  );

  const id = randomUUID();
  const rows = await tx.$queryRaw<{ lastValue: number }[]>`
    INSERT INTO document_sequence (id, kind, year, "lastValue", "updatedAt")
    VALUES (${id}, ${kind}::"SequenceKind", ${year}, 1, now())
    ON CONFLICT (kind, year)
    DO UPDATE SET "lastValue" = document_sequence."lastValue" + 1, "updatedAt" = now()
    RETURNING "lastValue";
  `;

  const seq = Number(rows[0]?.lastValue ?? 1);
  return { number: formatDocumentNumber(prefix, year, seq), year, seq };
}
