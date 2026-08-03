import { describe, it, expect } from "vitest";
import {
  rentalDays,
  daysInRange,
  computeRentalPrice,
  isRangeAvailable,
  fullyBookedDays,
  slugify,
  type BookingRange,
} from "./rental-core";

const n = (v: { toNumber: () => number }) => v.toNumber();

describe("rentalDays", () => {
  it("counts inclusive days", () => {
    expect(rentalDays("2026-07-01", "2026-07-01")).toBe(1);
    expect(rentalDays("2026-07-01", "2026-07-03")).toBe(3);
  });
});

describe("daysInRange", () => {
  it("lists all days", () => {
    expect(daysInRange("2026-07-01", "2026-07-03")).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
    ]);
  });
});

describe("computeRentalPrice", () => {
  it("computes rental + delivery + VAT", () => {
    const p = computeRentalPrice({
      dailyPriceExVat: 30,
      days: 2,
      deliveryKm: 10,
      pricePerKm: 0.5,
      vatRate: 23,
    });
    expect(n(p.rentalExVat)).toBe(60);
    expect(n(p.deliveryExVat)).toBe(5);
    expect(n(p.exVat)).toBe(65);
    expect(n(p.vat)).toBe(14.95);
    expect(n(p.inclVat)).toBe(79.95);
  });

  it("no delivery", () => {
    const p = computeRentalPrice({ dailyPriceExVat: 25, days: 1, deliveryKm: null, pricePerKm: 0.5, vatRate: 23 });
    expect(n(p.deliveryExVat)).toBe(0);
    expect(n(p.exVat)).toBe(25);
    expect(n(p.inclVat)).toBe(30.75);
  });
});

describe("availability", () => {
  const bookings: BookingRange[] = [{ startISO: "2026-07-10", endISO: "2026-07-12", units: 1 }];

  it("blocks an overlapping range when quantity is 1", () => {
    expect(isRangeAvailable(1, bookings, "2026-07-11", "2026-07-11")).toBe(false);
    expect(isRangeAvailable(1, bookings, "2026-07-13", "2026-07-14")).toBe(true);
  });

  it("allows overlap while units remain (quantity 2)", () => {
    expect(isRangeAvailable(2, bookings, "2026-07-11", "2026-07-11")).toBe(true);
    const two: BookingRange[] = [...bookings, { startISO: "2026-07-11", endISO: "2026-07-11", units: 1 }];
    expect(isRangeAvailable(2, two, "2026-07-11", "2026-07-11")).toBe(false);
  });

  it("reports fully-booked days", () => {
    expect(fullyBookedDays(1, bookings, "2026-07-09", "2026-07-13")).toEqual([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
    expect(fullyBookedDays(2, bookings, "2026-07-09", "2026-07-13")).toEqual([]);
  });
});

describe("slugify", () => {
  it("strips diacritics and spaces", () => {
    expect(slugify("Kanalizačná kamera 40 m")).toBe("kanalizacna-kamera-40-m");
    expect(slugify("Vysokotlakový čistič")).toBe("vysokotlakovy-cistic");
  });
});
