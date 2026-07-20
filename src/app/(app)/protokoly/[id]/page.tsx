import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCompanySettings } from "@/lib/services/settings";
import { renderTemplate } from "@/lib/services/email-templates";
import { ProtocolStatusBadge } from "@/components/ui/badges";
import { formatDate, formatDateTime, formatDecimal } from "@/lib/format";
import { customerDisplayName } from "@/lib/snapshots";
import type { CustomerSnapshot } from "@/lib/snapshots";
import { ProtocolActions } from "./protocol-actions";
import { PhotoManager } from "./photo-manager";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}

export default async function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const p = await prisma.repairProtocol.findUnique({
    where: { id },
    include: {
      workItems: { orderBy: { position: "asc" } },
      photos: { orderBy: { position: "asc" } },
      customer: true,
      revisions: { orderBy: { revision: "desc" }, include: { storedDocument: true } },
    },
  });
  if (!p) notFound();

  const company = await getCompanySettings();
  const emails = await prisma.emailLog.findMany({
    where: { documentType: "PROTOCOL", documentId: id },
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { name: true } } },
  });
  const snap = p.customerSnapshot as unknown as CustomerSnapshot;

  const defaultSubject = renderTemplate(company.protocolEmailSubject, { documentNumber: p.number });
  const defaultMessage = renderTemplate(company.protocolEmailBody, { documentNumber: p.number });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/protokoly" className="btn-ghost mt-1 p-2">
            ←
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-navy">{p.number}</h1>
              {p.revision > 1 && <span className="badge bg-slate-100 text-slate-600">revízia {p.revision}</span>}
              <ProtocolStatusBadge status={p.status} />
              {p.locked && <span className="badge bg-amber-100 text-amber-800">Uzamknuté</span>}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <Link href={`/zakaznici/${p.customerId}`} className="hover:underline">
                {customerDisplayName(p.customer)}
              </Link>{" "}
              · {formatDate(p.documentDate)}
            </p>
          </div>
        </div>
        <ProtocolActions
          id={p.id}
          number={p.number}
          revision={p.revision}
          locked={p.locked}
          status={p.status}
          recipient={snap.email ?? ""}
          defaultSubject={defaultSubject}
          defaultMessage={defaultMessage}
          fileName={`${p.number}-rev${p.revision}.pdf`}
        />
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand-dark">Identifikácia a klient</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Číslo poistnej udalosti" value={p.insuranceEventNumber} />
            <Field label="Dátum poruchy" value={p.faultDate ? formatDate(p.faultDate) : null} />
            <Field label="Dátum opravy" value={p.repairDate ? formatDate(p.repairDate) : null} />
            <Field label="Poisťovňa" value={p.insurer} />
            <Field label="Klient" value={snap.displayName} />
            <Field label="Telefón" value={snap.phone} />
            <Field label="E-mail" value={snap.email} />
            <Field label="Poistná zmluva" value={p.insuranceContractNumber} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand-dark">Diagnostika</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Typ poruchy" value={p.faultType} />
            <Field label="Príčina" value={p.faultCause} />
            <Field label="Popis poruchy" value={p.faultDescription} />
            <Field label="Rozsah poškodenia" value={p.damageExtent} />
          </div>
        </div>

        {p.workItems.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-brand-dark">Vykonané práce a materiál</h2>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Popis</th>
                    <th className="text-right">Množstvo</th>
                    <th>MJ</th>
                  </tr>
                </thead>
                <tbody>
                  {p.workItems.map((w) => (
                    <tr key={w.id}>
                      <td>{w.position}</td>
                      <td>{w.description}</td>
                      <td className="text-right">{w.quantity ? formatDecimal(w.quantity) : "—"}</td>
                      <td>{w.unit ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand-dark">Fotodokumentácia</h2>
          <PhotoManager
            protocolId={p.id}
            locked={p.locked}
            photos={p.photos.map((ph) => ({
              id: ph.id,
              blobUrl: ph.blobUrl,
              fileName: ph.fileName,
              category: ph.category,
              caption: ph.caption,
              includeInPdf: ph.includeInPdf,
              position: ph.position,
            }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
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
                      <span className="badge bg-red-100 text-red-800" title={e.errorMessage ?? ""}>Zlyhalo</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-brand-navy">Revízie</h3>
            {p.revisions.length === 0 ? (
              <p className="text-sm text-slate-400">Zatiaľ žiadne finalizované revízie.</p>
            ) : (
              <div className="space-y-2">
                {p.revisions.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Revízia {rev.revision} · {formatDate(rev.createdAt)}</span>
                    {rev.storedDocument && (
                      <a href={`/api/protocols/${p.id}/pdf?revision=${rev.revision}`} className="text-brand-dark hover:underline">
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
