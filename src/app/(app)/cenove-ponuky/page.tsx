import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState, Pagination } from "@/components/ui/page";
import { QuotationStatusBadge } from "@/components/ui/badges";
import { formatCurrency, formatDate } from "@/lib/format";
import { effectiveQuotationStatus } from "@/lib/services/quotations";
import { customerDisplayName } from "@/lib/snapshots";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.QuotationWhereInput = {
    ...(status ? { status: status as Prisma.EnumQuotationStatusFilter["equals"] } : {}),
    ...(q ? { number: { contains: q, mode: "insensitive" } } : {}),
  };

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: true },
    }),
    prisma.quotation.count({ where }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Cenové ponuky"
        subtitle={`${total} ${total === 1 ? "dokument" : "dokumentov"}`}
        action={
          <Link href="/cenove-ponuky/nova" className="btn-primary">
            Nová cenová ponuka
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label className="label">Číslo ponuky</label>
          <input name="q" defaultValue={q} placeholder="CP-2026-…" className="input" />
        </div>
        <div>
          <label className="label">Stav</label>
          <select name="status" defaultValue={status} className="input">
            <option value="">Všetky</option>
            {Object.entries(QUOTATION_STATUS_LABELS).map(([k, v]) => (
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

      {quotations.length === 0 ? (
        <EmptyState
          title="Žiadne cenové ponuky"
          action={
            <Link href="/cenove-ponuky/nova" className="btn-primary">
              Nová cenová ponuka
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
                <th>Vystavená</th>
                <th>Platnosť do</th>
                <th className="text-right">Suma s DPH</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((qq) => (
                <tr key={qq.id}>
                  <td>
                    <Link href={`/cenove-ponuky/${qq.id}`} className="font-semibold text-brand-dark hover:underline">
                      {qq.number}
                      {qq.revision > 1 && <span className="text-slate-400"> · rev. {qq.revision}</span>}
                    </Link>
                  </td>
                  <td>{customerDisplayName(qq.customer)}</td>
                  <td>
                    <QuotationStatusBadge status={effectiveQuotationStatus(qq)} />
                  </td>
                  <td>{formatDate(qq.issueDate)}</td>
                  <td>{formatDate(qq.validUntil)}</td>
                  <td className="text-right font-medium">{formatCurrency(qq.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination basePath="/cenove-ponuky" page={page} totalPages={totalPages} query={{ q, status }} />
    </div>
  );
}
