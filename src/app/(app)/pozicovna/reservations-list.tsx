"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { RENTAL_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  approveReservationAction,
  rejectReservationAction,
  cancelReservationAction,
  deleteReservationAction,
} from "./actions";

interface Reservation {
  id: string;
  number: string;
  toolName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string | null;
  customerNote: string | null;
  startDate: string;
  endDate: string;
  days: number;
  deliveryType: string;
  deliveryKm: number | null;
  deliveryAddress: string | null;
  priceInclVat: string;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export function ReservationsList({
  reservations,
  currentStatus,
}: {
  reservations: Reservation[];
  currentStatus: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Reservation | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      toast(msg, "success");
      setDetail(null);
      router.refresh();
    } else toast(res.error ?? "Chyba", "error");
  }

  const filters = ["", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <Link
            key={f || "all"}
            href={f ? `/pozicovna?status=${f}` : "/pozicovna"}
            className={cn(
              "rounded-full px-3 py-1",
              currentStatus === f ? "bg-brand-dark text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {f ? RENTAL_STATUS_LABELS[f] : "Všetky"}
          </Link>
        ))}
      </div>

      {reservations.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Žiadne rezervácie.</div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Číslo</th>
                <th>Náradie</th>
                <th>Zákazník</th>
                <th>Termín</th>
                <th className="text-right">Cena s DPH</th>
                <th>Stav</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="cursor-pointer" onClick={() => setDetail(r)}>
                  <td className="font-semibold text-brand-dark">{r.number}</td>
                  <td>{r.toolName}</td>
                  <td>
                    <div className="text-slate-800">{r.customerName}</div>
                    <div className="text-xs text-slate-400">{r.customerPhone}</div>
                  </td>
                  <td className="whitespace-nowrap">
                    {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  </td>
                  <td className="text-right font-medium">{formatCurrency(r.priceInclVat)}</td>
                  <td>
                    <span className={cn("badge", STATUS_COLORS[r.status])}>
                      {RENTAL_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="text-right">
                    {r.status === "PENDING" && (
                      <button
                        className="btn-primary py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          run(() => approveReservationAction(r.id), "Rezervácia schválená.");
                        }}
                        disabled={busy}
                      >
                        Schváliť
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Modal open onClose={() => setDetail(null)} title={`Rezervácia ${detail.number}`} size="lg">
          <div className="space-y-3 text-sm">
            <Row label="Náradie" value={detail.toolName} />
            <Row label="Termín" value={`${formatDate(detail.startDate)} – ${formatDate(detail.endDate)} (${detail.days} dní)`} />
            <Row label="Cena s DPH" value={formatCurrency(detail.priceInclVat)} />
            <div className="border-t border-slate-100 pt-3">
              <Row label="Zákazník" value={detail.customerName} />
              {detail.customerCompany && <Row label="Firma" value={detail.customerCompany} />}
              <Row label="E-mail" value={detail.customerEmail} />
              <Row label="Telefón" value={detail.customerPhone} />
              <Row
                label="Doprava"
                value={
                  detail.deliveryType === "DELIVERY"
                    ? `Dovoz${detail.deliveryKm ? ` (${detail.deliveryKm} km)` : ""} – ${detail.deliveryAddress ?? ""}`
                    : "Osobný odber"
                }
              />
              {detail.customerNote && <Row label="Poznámka" value={detail.customerNote} />}
            </div>
            <Row label="Vytvorená" value={formatDateTime(detail.createdAt)} />
            <div className="mt-1">
              <span className={cn("badge", STATUS_COLORS[detail.status])}>
                {RENTAL_STATUS_LABELS[detail.status]}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button className="btn-ghost text-red-600" onClick={() => setConfirmDelete(detail)} disabled={busy}>
              Zmazať
            </button>
            {detail.status === "PENDING" && (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => run(() => rejectReservationAction(detail.id), "Rezervácia zamietnutá.")}
                  disabled={busy}
                >
                  Zamietnuť
                </button>
                <button
                  className="btn-primary"
                  onClick={() => run(() => approveReservationAction(detail.id), "Rezervácia schválená.")}
                  disabled={busy}
                >
                  Schváliť
                </button>
              </>
            )}
            {detail.status === "APPROVED" && (
              <button
                className="btn-secondary"
                onClick={() => run(() => cancelReservationAction(detail.id), "Rezervácia zrušená.")}
                disabled={busy}
              >
                Zrušiť rezerváciu
              </button>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Zmazať rezerváciu?"
        message="Rezervácia bude natrvalo odstránená."
        danger
        confirmLabel="Zmazať"
        onConfirm={async () => {
          if (confirmDelete) await run(() => deleteReservationAction(confirmDelete.id), "Rezervácia zmazaná.");
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
