import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import { customerDisplayName } from "@/lib/snapshots";
import { QuotationStatusBadge } from "@/components/ui/badges";
import { effectiveQuotationStatus } from "@/lib/services/quotations";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeCustomers,
    quotationsThisMonth,
    draftQuotations,
    sentQuotations,
    acceptedQuotations,
    protocolsThisMonth,
    recentCustomers,
    recentQuotations,
    recentEmails,
    recentActivity,
    openForExpiry,
  ] = await Promise.all([
    prisma.customer.count({ where: { archivedAt: null } }),
    prisma.quotation.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.quotation.count({ where: { status: "DRAFT" } }),
    prisma.quotation.count({ where: { status: "SENT" } }),
    prisma.quotation.count({ where: { status: "ACCEPTED" } }),
    prisma.repairProtocol.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.customer.findMany({ where: { archivedAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.quotation.findMany({ orderBy: { updatedAt: "desc" }, take: 6, include: { customer: true } }),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true } } },
    }),
    prisma.quotation.findMany({
      where: { status: { in: ["DRAFT", "READY", "SENT"] }, validUntil: { lt: now } },
      select: { id: true },
    }),
  ]);

  const stats = [
    { label: "Aktívni zákazníci", value: activeCustomers, href: "/zakaznici" },
    { label: "Ponuky tento mesiac", value: quotationsThisMonth, href: "/cenove-ponuky" },
    { label: "Koncepty", value: draftQuotations, href: "/cenove-ponuky?status=DRAFT" },
    { label: "Odoslané ponuky", value: sentQuotations, href: "/cenove-ponuky?status=SENT" },
    { label: "Prijaté ponuky", value: acceptedQuotations, href: "/cenove-ponuky?status=ACCEPTED" },
    { label: "Expirované ponuky", value: openForExpiry.length, href: "/cenove-ponuky" },
    { label: "Protokoly tento mesiac", value: protocolsThisMonth, href: "/protokoly" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Prehľad</h1>
          <p className="text-sm text-slate-500">Vitajte, {user.name}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/zakaznici/novy" className="btn-secondary">Nový zákazník</Link>
          <Link href="/cenove-ponuky/nova" className="btn-secondary">Nová cenová ponuka</Link>
          <Link href="/protokoly/novy" className="btn-secondary">Nový protokol</Link>
          <Link href="/katalog" className="btn-secondary">Nová položka katalógu</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 transition hover:shadow-cardhover">
            <div className="text-3xl font-bold text-brand-dark">{s.value}</div>
            <div className="mt-1 text-xs font-medium text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-brand-navy">Naposledy upravené ponuky</h2>
          {recentQuotations.length === 0 ? (
            <p className="text-sm text-slate-400">Zatiaľ žiadne dokumenty.</p>
          ) : (
            <div className="space-y-1">
              {recentQuotations.map((q) => (
                <Link
                  key={q.id}
                  href={`/cenove-ponuky/${q.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <div>
                    <span className="font-medium text-slate-800">{q.number}</span>
                    <span className="ml-2 text-sm text-slate-400">{customerDisplayName(q.customer)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(q.grandTotal)}</span>
                    <QuotationStatusBadge status={effectiveQuotationStatus(q)} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-brand-navy">Noví zákazníci</h2>
          {recentCustomers.length === 0 ? (
            <p className="text-sm text-slate-400">Žiadni zákazníci.</p>
          ) : (
            <div className="space-y-1">
              {recentCustomers.map((c) => (
                <Link key={c.id} href={`/zakaznici/${c.id}`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <div className="text-sm font-medium text-slate-800">{customerDisplayName(c)}</div>
                  <div className="text-xs text-slate-400">{formatDate(c.createdAt)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-brand-navy">Nedávna e-mailová aktivita</h2>
          {recentEmails.length === 0 ? (
            <p className="text-sm text-slate-400">Žiadne odoslané e-maily.</p>
          ) : (
            <div className="space-y-2">
              {recentEmails.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-slate-700">{e.documentNumber}</div>
                    <div className="text-xs text-slate-400">{e.recipient}</div>
                  </div>
                  {e.success ? (
                    <span className="badge bg-emerald-100 text-emerald-800">OK</span>
                  ) : (
                    <span className="badge bg-red-100 text-red-800">Chyba</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-brand-navy">Nedávna systémová aktivita</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">Žiadna aktivita.</p>
          ) : (
            <ol className="space-y-2">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand" />
                  <span>
                    <span className="text-slate-700">{a.description}</span>
                    <span className="block text-xs text-slate-400">
                      {formatDateTime(a.createdAt)} · {a.actor?.name ?? "Systém"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
