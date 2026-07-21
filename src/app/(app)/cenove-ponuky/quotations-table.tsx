"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuotationStatusBadge } from "@/components/ui/badges";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteQuotationAction, deleteQuotationsAction } from "./actions";

export interface QuotationRow {
  id: string;
  number: string;
  revision: number;
  status: string;
  customerName: string;
  issueDate: string;
  validUntil: string;
  grandTotal: string;
}

export function QuotationsTable({ rows }: { rows: QuotationRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteOne, setDeleteOne] = useState<QuotationRow | null>(null);
  const [deleteBulk, setDeleteBulk] = useState(false);

  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function doDeleteOne() {
    if (!deleteOne) return;
    const res = await deleteQuotationAction(deleteOne.id);
    if (res.ok) {
      toast("Cenová ponuka vymazaná.", "success");
      router.refresh();
    } else toast(res.error, "error");
    setDeleteOne(null);
  }
  async function doDeleteBulk() {
    const res = await deleteQuotationsAction([...selected]);
    if (res.ok) {
      toast(`Vymazané: ${selected.size}`, "success");
      setSelected(new Set());
      router.refresh();
    } else toast(res.error, "error");
    setDeleteBulk(false);
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-dark">Vybrané: {selected.size}</span>
          <button className="btn-danger py-1.5 text-xs" onClick={() => setDeleteBulk(true)}>
            Vymazať vybrané
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Vybrať všetko" />
              </th>
              <th>Číslo</th>
              <th>Zákazník</th>
              <th>Stav</th>
              <th>Vystavená</th>
              <th>Platnosť do</th>
              <th className="text-right">Suma s DPH</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className={selected.has(q.id) ? "bg-brand/5" : ""}>
                <td>
                  <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} aria-label={`Vybrať ${q.number}`} />
                </td>
                <td>
                  <Link href={`/cenove-ponuky/${q.id}`} className="font-semibold text-brand-dark hover:underline">
                    {q.number}
                    {q.revision > 1 && <span className="text-slate-400"> · rev. {q.revision}</span>}
                  </Link>
                </td>
                <td>{q.customerName}</td>
                <td>
                  <QuotationStatusBadge status={q.status} />
                </td>
                <td>{formatDate(q.issueDate)}</td>
                <td>{formatDate(q.validUntil)}</td>
                <td className="text-right font-medium">{formatCurrency(q.grandTotal)}</td>
                <td className="text-right">
                  <button
                    className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteOne(q)}
                    aria-label="Vymazať"
                    title="Vymazať"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteOne}
        title="Vymazať cenovú ponuku?"
        message={`Ponuka ${deleteOne?.number} vrátane všetkých revízií a uložených PDF bude natrvalo vymazaná. Túto akciu nie je možné vrátiť späť.`}
        danger
        confirmLabel="Vymazať"
        onConfirm={doDeleteOne}
        onCancel={() => setDeleteOne(null)}
      />
      <ConfirmDialog
        open={deleteBulk}
        title="Vymazať vybrané ponuky?"
        message={`Natrvalo bude vymazaných ${selected.size} cenových ponúk vrátane revízií a PDF. Túto akciu nie je možné vrátiť späť.`}
        danger
        confirmLabel="Vymazať"
        onConfirm={doDeleteBulk}
        onCancel={() => setDeleteBulk(false)}
      />
    </div>
  );
}
