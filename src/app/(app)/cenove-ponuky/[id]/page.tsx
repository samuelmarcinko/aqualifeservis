import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCompanySettings } from "@/lib/services/settings";
import { effectiveQuotationStatus } from "@/lib/services/quotations";
import { renderTemplate } from "@/lib/services/email-templates";
import { QuotationStatusBadge } from "@/components/ui/badges";
import { formatCurrency, formatDate, formatDateTime, formatDecimal, formatPercent } from "@/lib/format";
import { customerDisplayName } from "@/lib/snapshots";
import { TAX_MODE_LABELS } from "@/lib/constants";
import type { CustomerSnapshot } from "@/lib/snapshots";
import { QuotationActions } from "./quotation-actions";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const q = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: { orderBy: { position: "asc" } },
      customer: true,
      revisions: { orderBy: { revision: "desc" }, include: { storedDocument: true } },
    },
  });
  if (!q) notFound();

  const company = await getCompanySettings();
  const emails = await prisma.emailLog.findMany({
    where: { documentType: "QUOTATION", documentId: id },
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { name: true } } },
  });

  const snap = q.customerSnapshot as unknown as CustomerSnapshot;
  const effective = effectiveQuotationStatus(q);
  const showVat = q.taxMode === "STANDARD";

  const defaultSubject = renderTemplate(company.quotationEmailSubject, { documentNumber: q.number });
  const defaultMessage = renderTemplate(company.quotationEmailBody, {
    documentNumber: q.number,
    validUntil: formatDate(q.validUntil),
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/cenove-ponuky" className="btn-ghost mt-1 p-2">
            ←
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-navy">{q.number}</h1>
              {q.revision > 1 && <span className="badge bg-slate-100 text-slate-600">revízia {q.revision}</span>}
              <QuotationStatusBadge status={effective} />
              {q.locked && <span className="badge bg-amber-100 text-amber-800">Uzamknuté</span>}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <Link href={`/zakaznici/${q.customerId}`} className="hover:underline">
                {customerDisplayName(q.customer)}
              </Link>{" "}
              · Vystavená {formatDate(q.issueDate)} · Platnosť do {formatDate(q.validUntil)}
            </p>
          </div>
        </div>
        <QuotationActions
          id={q.id}
          number={q.number}
          revision={q.revision}
          locked={q.locked}
          status={q.status}
          recipient={snap.email ?? ""}
          defaultSubject={defaultSubject}
          defaultMessage={defaultMessage}
          fileName={`${q.number}-rev${q.revision}.pdf`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Popis</th>
                  <th className="text-right">Množ.</th>
                  <th>MJ</th>
                  <th className="text-right">Cena/MJ</th>
                  <th className="text-right">Zľava</th>
                  {showVat && <th className="text-right">DPH</th>}
                  <th className="text-right">Spolu bez DPH</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.position}</td>
                    <td>
                      <div className="font-medium text-slate-800">{it.description}</div>
                      {it.detail && <div className="text-xs text-slate-400">{it.detail}</div>}
                    </td>
                    <td className="text-right">{formatDecimal(it.quantity)}</td>
                    <td>{it.unit}</td>
                    <td className="text-right">{formatCurrency(it.unitPrice)}</td>
                    <td className="text-right">
                      {Number(it.discountPct) > 0 ? formatPercent(it.discountPct) : "—"}
                    </td>
                    {showVat && <td className="text-right">{formatPercent(it.vatRate)}</td>}
                    <td className="text-right font-medium">{formatCurrency(it.lineNet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {q.customerNote && (
            <div className="card p-5">
              <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">Poznámka pre zákazníka</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{q.customerNote}</p>
            </div>
          )}

          {/* Email history */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-brand-navy">História odoslania</h3>
            {emails.length === 0 ? (
              <p className="text-sm text-slate-400">Dokument zatiaľ nebol odoslaný.</p>
            ) : (
              <div className="space-y-2">
                {emails.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">{e.recipient}</span>
                      <span className="text-slate-400"> · rev. {e.revision} · {formatDateTime(e.createdAt)}</span>
                      {e.sender && <span className="text-slate-400"> · {e.sender.name}</span>}
                    </div>
                    {e.success ? (
                      <span className="badge bg-emerald-100 text-emerald-800">Odoslané</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-800" title={e.errorMessage ?? ""}>
                        Zlyhalo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Totals */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-brand-navy">Súhrn</h3>
            <SummaryRow label="Medzisúčet" value={formatCurrency(q.subtotal)} />
            {Number(q.discountTotal) > 0 && <SummaryRow label="Zľava" value={`−${formatCurrency(q.discountTotal)}`} />}
            <SummaryRow label="Základ dane" value={formatCurrency(q.taxBase)} />
            {showVat && <SummaryRow label="DPH spolu" value={formatCurrency(q.vatTotal)} />}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-dark px-3 py-2.5">
              <span className="font-semibold text-white">Celkom {showVat ? "s DPH" : ""}</span>
              <span className="text-lg font-bold text-white">{formatCurrency(q.grandTotal)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Režim DPH: {TAX_MODE_LABELS[q.taxMode]}</p>
          </div>

          {/* Customer */}
          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-brand-navy">Odberateľ</h3>
            <p className="font-medium text-slate-800">{snap.displayName}</p>
            <p className="text-sm text-slate-500">
              {[snap.street, `${snap.postalCode ?? ""} ${snap.city ?? ""}`.trim()].filter(Boolean).join(", ")}
            </p>
            {snap.ico && <p className="text-sm text-slate-500">IČO: {snap.ico}</p>}
            {snap.email && <p className="text-sm text-slate-500">{snap.email}</p>}
          </div>

          {/* Revisions */}
          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-brand-navy">Revízie</h3>
            {q.revisions.length === 0 ? (
              <p className="text-sm text-slate-400">Zatiaľ žiadne finalizované revízie.</p>
            ) : (
              <div className="space-y-2">
                {q.revisions.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Revízia {rev.revision} · {formatDate(rev.createdAt)}
                    </span>
                    {rev.storedDocument && (
                      <a
                        href={`/api/quotations/${q.id}/pdf?revision=${rev.revision}`}
                        className="text-brand-dark hover:underline"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
