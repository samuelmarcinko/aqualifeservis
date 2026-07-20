import { describe, it, expect } from "vitest";
import { customerDisplayName } from "./snapshots";

describe("customerDisplayName", () => {
  it("uses first + last name for a person", () => {
    expect(
      customerDisplayName({ type: "PERSON", firstName: "Ján", lastName: "Novák" }),
    ).toBe("Ján Novák");
  });

  it("uses business name for a company", () => {
    expect(
      customerDisplayName({ type: "COMPANY", businessName: "Test s. r. o." }),
    ).toBe("Test s. r. o.");
  });

  it("falls back gracefully", () => {
    expect(customerDisplayName({ type: "PERSON" })).toBe("Bez mena");
    expect(customerDisplayName({ type: "COMPANY" })).toBe("Bez názvu");
  });
});
