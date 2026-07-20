import { Prisma } from "@/generated/prisma";

/**
 * Financial calculation service.
 *
 * All arithmetic uses Prisma.Decimal (decimal.js) — never native JS floating
 * point. Money is rounded to 2 decimals using ROUND_HALF_UP. Rates are treated
 * as percentages (e.g. 23 = 23%).
 */

export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

const HUNDRED = new Decimal(100);
const ROUND: Prisma.Decimal.Rounding = Prisma.Decimal.ROUND_HALF_UP;

export type TaxMode = "STANDARD" | "REVERSE_CHARGE" | "NO_VAT";
export type DocumentDiscountType = "NONE" | "PERCENT" | "FIXED";

export type DecimalInput = Prisma.Decimal | number | string;

export interface LineInput {
  quantity: DecimalInput;
  unitPrice: DecimalInput;
  /** Per-item discount percentage (0..100). */
  discountPct?: DecimalInput;
  /** VAT rate percentage. Ignored (treated as 0) in non-STANDARD modes. */
  vatRate?: DecimalInput;
}

export interface LineTotals {
  /** Net amount for the line after item discount, rounded to 2 decimals. */
  lineNet: Decimal;
  lineVat: Decimal;
  lineGross: Decimal;
}

export interface VatBreakdownRow {
  rate: string; // e.g. "23"
  base: Decimal;
  vat: Decimal;
}

export interface DocumentTotals {
  /** Sum of line nets before the document-level discount. */
  subtotal: Decimal;
  /** Document-level discount amount. */
  discountTotal: Decimal;
  /** subtotal - discountTotal = taxable base. */
  taxBase: Decimal;
  vatBreakdown: VatBreakdownRow[];
  vatTotal: Decimal;
  /** Total excluding VAT (== taxBase). */
  totalExclVat: Decimal;
  /** Final total including VAT. */
  grandTotal: Decimal;
}

function d(v: DecimalInput | undefined | null): Decimal {
  if (v === undefined || v === null || v === "") return new Decimal(0);
  return new Decimal(v);
}

export function round2(v: DecimalInput): Decimal {
  return d(v).toDecimalPlaces(2, ROUND);
}

/** Compute the net for a single line (quantity * unitPrice * (1 - discount)). */
function lineNetRaw(line: LineInput): Decimal {
  const qty = d(line.quantity);
  const price = d(line.unitPrice);
  const discountPct = d(line.discountPct);
  const factor = HUNDRED.minus(discountPct).dividedBy(HUNDRED);
  return qty.times(price).times(factor);
}

/**
 * Compute a single line's totals in STANDARD mode (used for previews and
 * per-line persistence). VAT for the whole document is recomputed with proper
 * grouping in {@link computeDocumentTotals}.
 */
export function computeLine(line: LineInput, taxMode: TaxMode = "STANDARD"): LineTotals {
  const net = round2(lineNetRaw(line));
  const rate = taxMode === "STANDARD" ? d(line.vatRate) : new Decimal(0);
  const vat = round2(net.times(rate).dividedBy(HUNDRED));
  const gross = round2(net.plus(vat));
  return { lineNet: net, lineVat: vat, lineGross: gross };
}

export interface DocumentDiscount {
  type: DocumentDiscountType;
  /** Percent (for PERCENT) or fixed EUR amount (for FIXED). */
  value: DecimalInput;
}

/**
 * Compute full document totals with correct VAT grouping.
 *
 * The document-level discount is apportioned across lines proportionally to
 * each line's net so that the VAT-per-rate summary stays consistent with the
 * discounted tax base.
 */
export function computeDocumentTotals(
  lines: LineInput[],
  taxMode: TaxMode,
  documentDiscount: DocumentDiscount = { type: "NONE", value: 0 },
): DocumentTotals {
  const lineNets = lines.map((l) => round2(lineNetRaw(l)));
  const subtotal = lineNets.reduce((acc, n) => acc.plus(n), new Decimal(0));

  // Document discount amount
  let discountTotal = new Decimal(0);
  if (documentDiscount.type === "PERCENT") {
    discountTotal = round2(subtotal.times(d(documentDiscount.value)).dividedBy(HUNDRED));
  } else if (documentDiscount.type === "FIXED") {
    discountTotal = round2(d(documentDiscount.value));
  }
  if (discountTotal.greaterThan(subtotal)) discountTotal = subtotal;
  if (discountTotal.lessThan(0)) discountTotal = new Decimal(0);

  const taxBase = round2(subtotal.minus(discountTotal));

  // Apportion discount across lines proportionally.
  const discountFactor = subtotal.isZero()
    ? new Decimal(0)
    : taxBase.dividedBy(subtotal);

  // Group discounted line nets by VAT rate.
  const groups = new Map<string, { base: Decimal; rate: Decimal }>();
  lines.forEach((line, i) => {
    const rawNet = lineNets[i] ?? new Decimal(0);
    const discountedNet = round2(rawNet.times(discountFactor));
    const rate = taxMode === "STANDARD" ? d(line.vatRate) : new Decimal(0);
    const key = rate.toString();
    const existing = groups.get(key);
    if (existing) {
      existing.base = existing.base.plus(discountedNet);
    } else {
      groups.set(key, { base: discountedNet, rate });
    }
  });

  const vatBreakdown: VatBreakdownRow[] = [];
  let vatTotal = new Decimal(0);

  if (taxMode === "STANDARD") {
    // Deterministic ordering: highest rate first.
    const sorted = [...groups.entries()].sort((a, b) =>
      groups.get(b[0])!.rate.comparedTo(groups.get(a[0])!.rate),
    );
    for (const [, g] of sorted) {
      const base = round2(g.base);
      const vat = round2(base.times(g.rate).dividedBy(HUNDRED));
      vatTotal = vatTotal.plus(vat);
      vatBreakdown.push({ rate: g.rate.toString(), base, vat });
    }
  }

  vatTotal = round2(vatTotal);
  const totalExclVat = taxBase;
  const grandTotal = round2(taxBase.plus(vatTotal));

  return {
    subtotal: round2(subtotal),
    discountTotal,
    taxBase,
    vatBreakdown,
    vatTotal,
    totalExclVat,
    grandTotal,
  };
}
