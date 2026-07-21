import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState, Pagination } from "@/components/ui/page";
import { customerDisplayName } from "@/lib/snapshots";
import { PROTOCOL_STATUS_LABELS } from "@/lib/constants";
import { ProtocolsTable } from "./protocols-table";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function ProtocolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.RepairProtocolWhereInput = {
    ...(status ? { status: status as Prisma.EnumProtocolStatusFilter["equals"] } : {}),
    ...(q ? { number: { contains: q, mode: "insensitive" } } : {}),
  };

  const [protocols, total] = await Promise.all([
    prisma.repairProtocol.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: true, _count: { select: { photos: true } } },
    }),
    prisma.repairProtocol.count({ where }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Protokoly o oprave"
        subtitle={`${total} ${total === 1 ? "dokument" : "dokumentov"}`}
        action={
          <Link href="/protokoly/novy" className="btn-primary">
            Nový protokol
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label className="label">Číslo protokolu</label>
          <input name="q" defaultValue={q} placeholder="PRO-2026-…" className="input" />
        </div>
        <div>
          <label className="label">Stav</label>
          <select name="status" defaultValue={status} className="input">
            <option value="">Všetky</option>
            {Object.entries(PROTOCOL_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" type="submit">
          Filtrovať
        </button>
      </form>

      {protocols.length === 0 ? (
        <EmptyState
          title="Žiadne protokoly"
          action={
            <Link href="/protokoly/novy" className="btn-primary">
              Nový protokol
            </Link>
          }
        />
      ) : (
        <ProtocolsTable
          rows={protocols.map((p) => ({
            id: p.id,
            number: p.number,
            revision: p.revision,
            status: p.status,
            customerName: customerDisplayName(p.customer),
            documentDate: p.documentDate.toISOString(),
            photoCount: p._count.photos,
          }))}
        />
      )}

      <Pagination basePath="/protokoly" page={page} totalPages={totalPages} query={{ q, status }} />
    </div>
  );
}
