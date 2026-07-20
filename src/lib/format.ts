import { Prisma } from "@/generated/prisma";

const TZ = "Europe/Bratislava";
const LOCALE = "sk-SK";

type NumLike = Prisma.Decimal | number | string;

function toNumber(v: NumLike): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return v.toNumber();
}

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** e.g. "1 234,56 €" */
export function formatCurrency(v: NumLike): string {
  return currencyFormatter.format(toNumber(v));
}

export function formatNumber(v: NumLike, maxFractionDigits = 3): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(toNumber(v));
}

export function formatDecimal(v: NumLike): string {
  return numberFormatter.format(toNumber(v));
}

/** DD.MM.YYYY in Europe/Bratislava */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** DD.MM.YYYY HH:mm */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatPercent(v: NumLike): string {
  const n = toNumber(v);
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 }).format(n)} %`;
}
