import { describe, it, expect } from "vitest";
import { formatDocumentNumber } from "./numbering";

describe("formatDocumentNumber", () => {
  it("pads the sequence to 4 digits", () => {
    expect(formatDocumentNumber("CP", 2026, 1)).toBe("CP-2026-0001");
    expect(formatDocumentNumber("CP", 2026, 2)).toBe("CP-2026-0002");
    expect(formatDocumentNumber("PRO", 2026, 42)).toBe("PRO-2026-0042");
  });

  it("supports 4+ digit sequences without truncating", () => {
    expect(formatDocumentNumber("CP", 2026, 12345)).toBe("CP-2026-12345");
  });

  it("uses the year in the number so numbering resets annually", () => {
    expect(formatDocumentNumber("CP", 2025, 1)).toBe("CP-2025-0001");
    expect(formatDocumentNumber("CP", 2026, 1)).toBe("CP-2026-0001");
  });
});
