import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState, Pagination } from "@/components/ui/page";
import { effectiveQuotationStatus } from "@/lib/services/quotations";
import { customerDisplayName } from "@/lib/snapshots";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";
import { QuotationsTable } from "./quotations-table";

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
        <QuotationsTable
          rows={quotations.map((qq) => ({
            id: qq.id,
            number: qq.number,
            revision: qq.revision,
            status: effectiveQuotationStatus(qq),
            customerName: customerDisplayName(qq.customer),
            issueDate: qq.issueDate.toISOString(),
            validUntil: qq.validUntil.toISOString(),
            grandTotal: qq.grandTotal.toString(),
          }))}
        />
      )}

      <Pagination basePath="/cenove-ponuky" page={page} totalPages={totalPages} query={{ q, status }} />
    </div>
  );
}
