import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState, Pagination } from "@/components/ui/page";
import { CustomerTypeBadge } from "@/components/ui/badges";
import { customerDisplayName } from "@/lib/snapshots";
import { formatDate } from "@/lib/format";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const type = sp.type ?? "";
  const showArchived = sp.archived === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.CustomerWhereInput = {
    archivedAt: showArchived ? { not: null } : null,
    ...(type ? { type: type as Prisma.EnumCustomerTypeFilter["equals"] } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { businessName: { contains: q, mode: "insensitive" } },
            { contactPerson: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { ico: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { quotations: true, protocols: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Zákazníci"
        subtitle={`${total} ${total === 1 ? "záznam" : "záznamov"}`}
        action={
          <Link href="/zakaznici/novy" className="btn-primary">
            Nový zákazník
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[220px] flex-1">
          <label className="label">Vyhľadávanie</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Meno, firma, e-mail, telefón, IČO…"
            className="input"
          />
        </div>
        <div>
          <label className="label">Typ</label>
          <select name="type" defaultValue={type} className="input">
            <option value="">Všetky</option>
            {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
          <input type="checkbox" name="archived" value="1" defaultChecked={showArchived} />
          Archivované
        </label>
        <button className="btn-primary" type="submit">
          Filtrovať
        </button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title="Žiadni zákazníci"
          description="Zatiaľ tu nie sú žiadne záznamy. Vytvorte prvého zákazníka."
          action={
            <Link href="/zakaznici/novy" className="btn-primary">
              Nový zákazník
            </Link>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Zákazník</th>
                <th>Typ</th>
                <th>Kontakt</th>
                <th>Mesto</th>
                <th className="text-center">Ponuky</th>
                <th className="text-center">Protokoly</th>
                <th>Vytvorený</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="cursor-pointer">
                  <td>
                    <Link href={`/zakaznici/${c.id}`} className="font-semibold text-brand-dark hover:underline">
                      {customerDisplayName(c)}
                    </Link>
                    {c.ico && <div className="text-xs text-slate-400">IČO: {c.ico}</div>}
                  </td>
                  <td>
                    <CustomerTypeBadge type={c.type} />
                  </td>
                  <td>
                    <div className="text-slate-700">{c.email ?? "—"}</div>
                    <div className="text-xs text-slate-400">{c.phone ?? ""}</div>
                  </td>
                  <td>{c.city ?? "—"}</td>
                  <td className="text-center">{c._count.quotations}</td>
                  <td className="text-center">{c._count.protocols}</td>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/zakaznici"
        page={page}
        totalPages={totalPages}
        query={{ q, type, archived: showArchived ? "1" : undefined }}
      />
    </div>
  );
}
