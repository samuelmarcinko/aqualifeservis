import { describe, it, expect } from "vitest";
import { effectiveQuotationStatus } from "./quotations";

const past = new Date(Date.now() - 86400000);
const future = new Date(Date.now() + 86400000);

describe("effectiveQuotationStatus", () => {
  it("marks overdue open quotations as EXPIRED", () => {
    expect(effectiveQuotationStatus({ status: "SENT", validUntil: past })).toBe("EXPIRED");
    expect(effectiveQuotationStatus({ status: "READY", validUntil: past })).toBe("EXPIRED");
    expect(effectiveQuotationStatus({ status: "DRAFT", validUntil: past })).toBe("EXPIRED");
  });

  it("keeps open quotations within validity", () => {
    expect(effectiveQuotationStatus({ status: "SENT", validUntil: future })).toBe("SENT");
  });

  it("never overrides a decided status even if overdue", () => {
    expect(effectiveQuotationStatus({ status: "ACCEPTED", validUntil: past })).toBe("ACCEPTED");
    expect(effectiveQuotationStatus({ status: "REJECTED", validUntil: past })).toBe("REJECTED");
    expect(effectiveQuotationStatus({ status: "CANCELLED", validUntil: past })).toBe("CANCELLED");
  });
});
