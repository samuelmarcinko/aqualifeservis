import { describe, it, expect } from "vitest";
import { computeLine, computeDocumentTotals, round2 } from "./money";

const num = (v: { toNumber: () => number }) => v.toNumber();

describe("round2", () => {
  it("rounds half up", () => {
    expect(round2("1.005").toString()).toBe("1.01");
    expect(round2("2.675").toString()).toBe("2.68");
    expect(round2("1.004").toString()).toBe("1");
  });
});

describe("computeLine", () => {
  it("computes a standard line with 23% VAT", () => {
    const r = computeLine({ quantity: 2, unitPrice: 100, vatRate: 23 });
    expect(num(r.lineNet)).toBe(200);
    expect(num(r.lineVat)).toBe(46);
    expect(num(r.lineGross)).toBe(246);
  });

  it("applies a per-item discount", () => {
    const r = computeLine({ quantity: 1, unitPrice: 100, discountPct: 10, vatRate: 23 });
    expect(num(r.lineNet)).toBe(90);
    expect(num(r.lineVat)).toBe(20.7);
    expect(num(r.lineGross)).toBe(110.7);
  });

  it("handles fractional quantities precisely (no float drift)", () => {
    const r = computeLine({ quantity: "0.1", unitPrice: "0.2", vatRate: 0 });
    // 0.1 * 0.2 = 0.02 exactly, not 0.020000000000000004
    expect(r.lineNet.toString()).toBe("0.02");
  });

  it("adds no VAT in reverse-charge mode", () => {
    const r = computeLine({ quantity: 3, unitPrice: 50, vatRate: 23 }, "REVERSE_CHARGE");
    expect(num(r.lineNet)).toBe(150);
    expect(num(r.lineVat)).toBe(0);
    expect(num(r.lineGross)).toBe(150);
  });
});

describe("computeDocumentTotals", () => {
  it("groups VAT by rate (standard)", () => {
    const totals = computeDocumentTotals(
      [
        { quantity: 1, unitPrice: 100, vatRate: 23 },
        { quantity: 1, unitPrice: 100, vatRate: 19 },
        { quantity: 2, unitPrice: 50, vatRate: 23 },
      ],
      "STANDARD",
    );
    expect(num(totals.subtotal)).toBe(300);
    expect(num(totals.taxBase)).toBe(300);
    expect(totals.vatBreakdown).toHaveLength(2);
    const r23 = totals.vatBreakdown.find((r) => r.rate === "23")!;
    const r19 = totals.vatBreakdown.find((r) => r.rate === "19")!;
    expect(num(r23.base)).toBe(200);
    expect(num(r23.vat)).toBe(46);
    expect(num(r19.base)).toBe(100);
    expect(num(r19.vat)).toBe(19);
    expect(num(totals.vatTotal)).toBe(65);
    expect(num(totals.grandTotal)).toBe(365);
  });

  it("applies a document-level percentage discount and apportions it", () => {
    const totals = computeDocumentTotals(
      [
        { quantity: 1, unitPrice: 100, vatRate: 23 },
        { quantity: 1, unitPrice: 100, vatRate: 23 },
      ],
      "STANDARD",
      { type: "PERCENT", value: 10 },
    );
    expect(num(totals.subtotal)).toBe(200);
    expect(num(totals.discountTotal)).toBe(20);
    expect(num(totals.taxBase)).toBe(180);
    expect(num(totals.vatTotal)).toBe(41.4);
    expect(num(totals.grandTotal)).toBe(221.4);
  });

  it("applies a fixed document discount", () => {
    const totals = computeDocumentTotals(
      [{ quantity: 1, unitPrice: 100, vatRate: 23 }],
      "STANDARD",
      { type: "FIXED", value: 25 },
    );
    expect(num(totals.taxBase)).toBe(75);
    expect(num(totals.vatTotal)).toBe(17.25);
    expect(num(totals.grandTotal)).toBe(92.25);
  });

  it("never lets the discount exceed the subtotal", () => {
    const totals = computeDocumentTotals(
      [{ quantity: 1, unitPrice: 100, vatRate: 23 }],
      "STANDARD",
      { type: "FIXED", value: 500 },
    );
    expect(num(totals.discountTotal)).toBe(100);
    expect(num(totals.taxBase)).toBe(0);
    expect(num(totals.grandTotal)).toBe(0);
  });

  it("adds no VAT in reverse-charge mode", () => {
    const totals = computeDocumentTotals(
      [
        { quantity: 1, unitPrice: 100, vatRate: 23 },
        { quantity: 1, unitPrice: 200, vatRate: 23 },
      ],
      "REVERSE_CHARGE",
    );
    expect(num(totals.taxBase)).toBe(300);
    expect(num(totals.vatTotal)).toBe(0);
    expect(num(totals.grandTotal)).toBe(300);
    expect(totals.vatBreakdown).toHaveLength(0);
  });

  it("adds no VAT in no-VAT mode", () => {
    const totals = computeDocumentTotals(
      [{ quantity: 4, unitPrice: 25, vatRate: 23 }],
      "NO_VAT",
    );
    expect(num(totals.taxBase)).toBe(100);
    expect(num(totals.vatTotal)).toBe(0);
    expect(num(totals.grandTotal)).toBe(100);
  });

  it("handles an empty document", () => {
    const totals = computeDocumentTotals([], "STANDARD");
    expect(num(totals.subtotal)).toBe(0);
    expect(num(totals.grandTotal)).toBe(0);
  });
});
