import { Decimal, round2, type DecimalInput } from "./money";

/**
 * Pure, testable helpers for rental pricing and availability. No DB access.
 * Dates are handled at day granularity via ISO "YYYY-MM-DD" strings.
 */

export function toDayISO(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** Parse "YYYY-MM-DD" to a UTC-midnight Date. */
export function dayToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Inclusive day count between two ISO days (min 1). */
export function rentalDays(startISO: string, endISO: string): number {
  const s = dayToDate(startISO).getTime();
  const e = dayToDate(endISO).getTime();
  const diff = Math.round((e - s) / 86_400_000) + 1;
  return diff < 1 ? 1 : diff;
}

/** List of ISO days in [startISO, endISO] inclusive. */
export function daysInRange(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cur = dayToDate(startISO).getTime();
  const end = dayToDate(endISO).getTime();
  while (cur <= end) {
    out.push(new Date(cur).toISOString().slice(0, 10));
    cur += 86_400_000;
  }
  return out;
}

export interface PriceInput {
  dailyPriceExVat: DecimalInput;
  days: number;
  deliveryKm?: number | null;
  pricePerKm: DecimalInput;
  vatRate: DecimalInput;
}

export interface RentalPrice {
  rentalExVat: Decimal;
  deliveryExVat: Decimal;
  exVat: Decimal;
  vat: Decimal;
  inclVat: Decimal;
}

export function computeRentalPrice(input: PriceInput): RentalPrice {
  const daily = new Decimal(input.dailyPriceExVat);
  const rentalExVat = round2(daily.times(input.days));
  const deliveryExVat = input.deliveryKm
    ? round2(new Decimal(input.pricePerKm).times(input.deliveryKm))
    : new Decimal(0);
  const exVat = round2(rentalExVat.plus(deliveryExVat));
  const vat = round2(exVat.times(new Decimal(input.vatRate)).dividedBy(100));
  const inclVat = round2(exVat.plus(vat));
  return { rentalExVat, deliveryExVat, exVat, vat, inclVat };
}

export interface BookingRange {
  startISO: string;
  endISO: string;
  units: number;
}

/** Units used on a given day across bookings. */
function usedUnitsOnDay(day: string, bookings: BookingRange[]): number {
  let used = 0;
  for (const b of bookings) {
    if (day >= b.startISO && day <= b.endISO) used += b.units;
  }
  return used;
}

/**
 * Whether a new booking of `need` units fits over [startISO, endISO] given the
 * tool's total quantity and existing bookings.
 */
export function isRangeAvailable(
  quantity: number,
  bookings: BookingRange[],
  startISO: string,
  endISO: string,
  need = 1,
): boolean {
  for (const day of daysInRange(startISO, endISO)) {
    if (usedUnitsOnDay(day, bookings) + need > quantity) return false;
  }
  return true;
}

/** Days within [fromISO, toISO] that are fully booked (used >= quantity). */
export function fullyBookedDays(
  quantity: number,
  bookings: BookingRange[],
  fromISO: string,
  toISO: string,
): string[] {
  return daysInRange(fromISO, toISO).filter(
    (day) => usedUnitsOnDay(day, bookings) >= quantity,
  );
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
