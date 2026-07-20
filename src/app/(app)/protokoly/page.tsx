import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState, Pagination } from "@/components/ui/page";
import { ProtocolStatusBadge } from "@/components/ui/badges";
import { formatDate } from "@/lib/format";
import { customerDisplayName } from "@/lib/snapshots";
import { PROTOCOL_STATUS_LABELS } from "@/lib/constants";

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
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Číslo</th>
                <th>Zákazník</th>
                <th>Stav</th>
                <th>Dátum</th>
                <th className="text-center">Foto</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/protokoly/${p.id}`} className="font-semibold text-brand-dark hover:underline">
                      {p.number}
                      {p.revision > 1 && <span className="text-slate-400"> · rev. {p.revision}</span>}
                    </Link>
                  </td>
                  <td>{customerDisplayName(p.customer)}</td>
                  <td>
                    <ProtocolStatusBadge status={p.status} />
                  </td>
                  <td>{formatDate(p.documentDate)}</td>
                  <td className="text-center">{p._count.photos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination basePath="/protokoly" page={page} totalPages={totalPages} query={{ q, status }} />
    </div>
  );
}
