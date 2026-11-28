import { describe, expect, it } from "vitest";
import { MAX_PASSENGERS, VEHICLE_CLASSES, vehiclesForPassengers } from "./fares";
import { firstRidePrice } from "./tariff";
import { METRES_PER_MILE, quoteJourney } from "./distance";

describe("vehiclesForPassengers", () => {
  it("offers every class to one passenger", () => {
    expect(vehiclesForPassengers(1)).toEqual([...VEHICLE_CLASSES]);
  });
  it("drops the three-seat classes for four passengers", () => {
    expect(vehiclesForPassengers(4)).toEqual(["standard", "business-comfort", "mpv"]);
  });
  it("only the MPV takes five or six", () => {
    expect(vehiclesForPassengers(5)).toEqual(["mpv"]);
    expect(vehiclesForPassengers(6)).toEqual(["mpv"]);
    expect(MAX_PASSENGERS).toBe(6);
  });
  it("offers nothing above the largest car", () => {
    expect(vehiclesForPassengers(7)).toEqual([]);
  });
  it("treats nonsense as one passenger", () => {
    expect(vehiclesForPassengers(Number.NaN)).toHaveLength(VEHICLE_CLASSES.length);
    expect(vehiclesForPassengers(0)).toHaveLength(VEHICLE_CLASSES.length);
  });
});

describe("firstRidePrice", () => {
  it("takes 20% off", () => {
    expect(firstRidePrice(9000)).toBe(7200);
    expect(firstRidePrice(15000)).toBe(12000);
  });
  it("rounds down to whole pounds, in the customer's favour", () => {
    expect(firstRidePrice(9700)).toBe(7700); // £77.60 -> £77
  });
  it("can be switched off", () => {
    expect(firstRidePrice(9000, 0)).toBe(9000);
  });
});

describe("MPV distance tariff", () => {
  const soho = { text: "Soho, London W1D 3QU", postcode: "W1D 3QU" };
  const lhr = { text: "Heathrow Airport Terminal 5", types: ["airport"] };
  it("prices above Business Comfort and below Executive on the same route", () => {
    const d = 20 * METRES_PER_MILE;
    const q = (vehicle: "business-comfort" | "mpv" | "executive") =>
      quoteJourney({ vehicle, distanceMeters: d, pickup: soho, dropoff: lhr });
    const price = (r: ReturnType<typeof q>) => (r.ok ? r.pricePence : 0);
    const [bc, mpv, ex] = [price(q("business-comfort")), price(q("mpv")), price(q("executive"))] as const;
    expect(mpv).toBeGreaterThan(bc);
    expect(mpv).toBeLessThan(ex);
  });
});
