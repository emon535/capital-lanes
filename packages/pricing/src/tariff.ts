// Distance-based tariff for Capital Lane Ltd. Money is always integer pence.
//
// SUGGESTED DEFAULTS, NOT YET CONFIRMED BY EMON (21 November 2026).
// Calibrated against Google's real shortest driving distances from 1 Canada Square
// (checked 21 Nov 2026): Heathrow ~22.7 miles, Gatwick ~32.2 miles (A23). The fixed
// fares rise £20 (£30 for Luxury) over those ~9.5 extra miles, which sets the per-mile
// rate; the class premium then sits in the base fee.
//
//                    base + per mile x miles + drop-off  -> 22.7 mi / 32.2 mi   fixed fare
//   Standard          £35 + £2.10 x mi        + £7       -> £90  / £110         £90  / £110
//   Business Comfort  £55 + £2.10 x mi        + £7       -> £110 / £130         £110 / £130
//   Executive         £75 + £2.10 x mi        + £7       -> £130 / £150         £130 / £150
//   Luxury            £72 + £3.15 x mi        + £7       -> £151 / £181         £150 / £180
//   MPV (suggested)   £65 + £2.10 x mi        + £7       -> £120 / £140         £120 / £140
//
// The fixed fares still win on those two routes (see FIXED_ROUTES).
// Change any number here and the whole site follows.

import type { VehicleClass } from "./fares";

export interface DistanceTariff {
  /** Flat fee added to every journey. */
  baseFeePence: number;
  /** Charged per mile of the driving route. */
  perMilePence: number;
  /** The quote never goes below this. */
  minimumFarePence: number;
}

export const DISTANCE_TARIFFS: Record<VehicleClass, DistanceTariff> = {
  standard: { baseFeePence: 3500, perMilePence: 210, minimumFarePence: 4000 },
  "business-comfort": { baseFeePence: 5500, perMilePence: 210, minimumFarePence: 6000 },
  executive: { baseFeePence: 7500, perMilePence: 210, minimumFarePence: 8000 },
  luxury: { baseFeePence: 7200, perMilePence: 315, minimumFarePence: 8500 },
  // SUGGESTED, waiting for Emon (28 Nov 2026).
  mpv: { baseFeePence: 6500, perMilePence: 210, minimumFarePence: 7000 },
};

/** New customers get this much off their first journey. 0 switches the offer off. */
export const FIRST_RIDE_DISCOUNT_PERCENT = 20;

/**
 * First-ride price: the fare less the discount, rounded down to whole pounds
 * (in the customer's favour). Pure function: the booking system applies it again
 * once it can tell a first-time customer from a returning one.
 */
export function firstRidePrice(pricePence: number, percent: number = FIRST_RIDE_DISCOUNT_PERCENT): number {
  if (percent <= 0) return pricePence;
  return Math.floor((pricePence * (100 - percent)) / 100 / 100) * 100;
}

export interface TariffExtras {
  /** Added when the drop-off is at an airport (airport drop-off charge). */
  airportDropOffPence: number;
  /** Added when the pickup is at an airport (meet and greet plus terminal parking). */
  airportPickupPence: number;
  /** Night rate as a percentage of the journey fare. 0 switches it off. */
  nightSurchargePercent: number;
  /** Night rate applies from this hour (24h clock, inclusive)... */
  nightStartHour: number;
  /** ...until this hour (exclusive). */
  nightEndHour: number;
  /** Free waiting included at an airport pickup, in minutes. */
  freeWaitingAirportMinutes: number;
  /** Free waiting included at any other pickup, in minutes. */
  freeWaitingStandardMinutes: number;
  /** Charged per minute once free waiting runs out (billed after the journey, never in the quote). */
  waitingPerMinutePence: number;
  /** Quotes are rounded up to the nearest multiple of this. 100 = whole pounds. */
  roundUpToPence: number;
}

export const TARIFF_EXTRAS: TariffExtras = {
  airportDropOffPence: 700,
  airportPickupPence: 1500,
  nightSurchargePercent: 10,
  nightStartHour: 23,
  nightEndHour: 5,
  freeWaitingAirportMinutes: 60,
  freeWaitingStandardMinutes: 15,
  waitingPerMinutePence: 50,
  roundUpToPence: 100,
};

/**
 * Areas treated as "E14" when Google gives no postcode for a place
 * (for example the Canary Wharf neighbourhood itself). Lower case.
 */
export const E14_AREA_NAMES = ["canary wharf", "isle of dogs", "millwall", "cubitt town", "blackwall"];
