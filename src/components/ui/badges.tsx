import { cn } from "@/lib/utils";
import {
  QUOTATION_STATUS_LABELS,
  PROTOCOL_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
} from "@/lib/constants";

const QUOTATION_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  READY: "bg-sky-100 text-sky-800",
  SENT: "bg-indigo-100 text-indigo-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-slate-200 text-slate-600",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

const PROTOCOL_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  FINAL: "bg-emerald-100 text-emerald-800",
  SENT: "bg-indigo-100 text-indigo-800",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

export function QuotationStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge", QUOTATION_COLORS[status] ?? "bg-slate-100 text-slate-700")}>
      {QUOTATION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ProtocolStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge", PROTOCOL_COLORS[status] ?? "bg-slate-100 text-slate-700")}>
      {PROTOCOL_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function CustomerTypeBadge({ type }: { type: string }) {
  return (
    <span className="badge bg-brand/10 text-brand-dark">{CUSTOMER_TYPE_LABELS[type] ?? type}</span>
  );
}
