import { describe, expect, it } from "vitest";
import { METRES_PER_MILE, isE14, matchFixedAirport, quoteJourney } from "./distance";
import { TARIFF_EXTRAS } from "./tariff";

const miles = (m: number) => m * METRES_PER_MILE;
const cw = { text: "1 Canada Square, London E14 5AB, UK", postcode: "E14 5AB" };
const lhr = { text: "Heathrow Airport Terminal 5, Hounslow TW6 2GA, UK", types: ["airport"] };
const lgw = { text: "Gatwick Airport North Terminal, Horley, Gatwick RH6 0PJ, UK", types: ["airport"] };
const soho = { text: "Soho Square, London W1D 3QP, UK", postcode: "W1D 3QP" };
const city = { text: "Bank, London EC2R 8AH, UK", postcode: "EC2R 8AH" };

describe("place matching", () => {
  it("spots E14 by postcode, district or area name", () => {
    expect(isE14(cw)).toBe(true);
    expect(isE14({ text: "Canary Wharf, London, UK" })).toBe(true);
    expect(isE14({ text: "E14" })).toBe(true);
    expect(isE14(soho)).toBe(false);
    expect(isE14({ text: "Unit A2, Mile End Road, London E1 4NS" })).toBe(false);
  });
  it("spots the fixed-price airports", () => {
    expect(matchFixedAirport(lhr)).toBe("heathrow");
    expect(matchFixedAirport(lgw)).toBe("gatwick");
    expect(matchFixedAirport(soho)).toBeUndefined();
  });
});

describe("quoteJourney", () => {
  it("uses the fixed fare for E14 to Heathrow, whatever the distance", () => {
    const q = quoteJourney({ vehicle: "luxury", distanceMeters: miles(40), pickup: cw, dropoff: lhr, time: "02:00" });
    expect(q).toMatchObject({ ok: true, kind: "fixed", pricePence: 15000 });
  });

  it("does not apply the fixed fare in the other direction", () => {
    const q = quoteJourney({ vehicle: "standard", distanceMeters: miles(25), pickup: lhr, dropoff: cw });
    expect(q).toMatchObject({ ok: true, kind: "distance" });
  });

  it("lands close to the fixed fares at typical distances (calibration)", () => {
    const fromCity = (dropoff: typeof lhr, m: number, vehicle: "standard" | "luxury") =>
      quoteJourney({ vehicle, distanceMeters: miles(m), pickup: city, dropoff });
    expect(fromCity(lhr, 22.7, "standard")).toMatchObject({ pricePence: 9000 });
    expect(fromCity(lgw, 32.2, "standard")).toMatchObject({ pricePence: 11000 });
    expect(fromCity(lhr, 22.7, "luxury")).toMatchObject({ pricePence: 15100 });
    expect(fromCity(lgw, 32.2, "luxury")).toMatchObject({ pricePence: 18100 });
  });

  it("applies the minimum fare on short trips", () => {
    const q = quoteJourney({ vehicle: "standard", distanceMeters: miles(2), pickup: soho, dropoff: city });
    expect(q).toMatchObject({ ok: true, pricePence: 4000 });
  });

  it("adds the night rate and airport pickup fee", () => {
    const q = quoteJourney({ vehicle: "standard", distanceMeters: miles(20), pickup: lhr, dropoff: soho, time: "23:30" });
    if (!q.ok || q.kind !== "distance") throw new Error("expected distance quote");
    // 3500 + 4200 = 7700; night 10% = 770; pickup 1500 -> 9970 -> rounded up to 10000
    expect(q.pricePence).toBe(10000);
    expect(q.freeWaitingMinutes).toBe(TARIFF_EXTRAS.freeWaitingAirportMinutes);
    expect(q.lines.map((l) => l.label)).toContain("Night rate (+10%)");
  });

  it("rejects a missing distance", () => {
    expect(quoteJourney({ vehicle: "standard", distanceMeters: 0, pickup: soho, dropoff: city })).toEqual({
      ok: false,
      code: "INVALID_DISTANCE",
    });
  });
});
