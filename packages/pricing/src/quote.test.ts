import { describe, expect, it } from "vitest";
import { formatPence, quoteFixedFare } from "./quote";
import type { Airport, VehicleClass } from "./fares";

const cases: Array<[Airport, VehicleClass, number]> = [
  ["heathrow", "standard", 9000],
  ["heathrow", "business-comfort", 11000],
  ["heathrow", "executive", 13000],
  ["heathrow", "luxury", 15000],
  ["gatwick", "standard", 11000],
  ["gatwick", "business-comfort", 13000],
  ["gatwick", "executive", 15000],
  ["gatwick", "luxury", 18000],
];

describe("quoteFixedFare from E14", () => {
  it.each(cases)("%s %s costs %i pence", (airport, vehicle, pence) => {
    expect(quoteFixedFare({ origin: "e14", airport, vehicle })).toEqual({
      ok: true,
      pricePence: pence,
    });
  });
});

describe("formatPence", () => {
  it("formats whole pounds without decimals", () => {
    expect(formatPence(9000)).toBe("£90");
  });
  it("keeps pence when present", () => {
    expect(formatPence(9050)).toBe("£90.50");
  });
});
