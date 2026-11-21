import { FIXED_ROUTES, type Airport, type VehicleClass } from "./fares";
import { DISTANCE_TARIFFS, E14_AREA_NAMES, TARIFF_EXTRAS, type TariffExtras } from "./tariff";

export const METRES_PER_MILE = 1609.344;

/** What we know about one end of a journey, from Google or from typed text. */
export interface PlaceFacts {
  /** Free text: the address line the customer chose or typed. */
  text: string;
  /** UK postcode if known, any spacing. */
  postcode?: string;
  /** Google place types, e.g. ["airport"]. */
  types?: string[];
}

export interface FareLine {
  label: string;
  pence: number;
}

export interface DistanceQuoteRequest {
  vehicle: VehicleClass;
  /** Driving distance in metres (from the routing service). */
  distanceMeters: number;
  pickup: PlaceFacts;
  dropoff: PlaceFacts;
  /** Pickup time as "HH:MM", if the customer gave one. */
  time?: string;
}

export type DistanceQuote =
  | {
      ok: true;
      kind: "fixed";
      pricePence: number;
      airport: Airport;
    }
  | {
      ok: true;
      kind: "distance";
      pricePence: number;
      miles: number;
      lines: FareLine[];
      freeWaitingMinutes: number;
    }
  | { ok: false; code: "INVALID_DISTANCE" };

const AIRPORT_PATTERNS: Record<Airport, { text: RegExp; postcode: RegExp }> = {
  heathrow: { text: /\bheathrow\b|\blhr\b/i, postcode: /^TW6/ },
  gatwick: { text: /\bgatwick\b|\blgw\b/i, postcode: /^RH60/ },
};

const OTHER_AIRPORT_TEXT = /\bairport\b|\bstansted\b|\bluton\b|london city airport/i;

const normalisePostcode = (p?: string) => (p ?? "").replace(/\s+/g, "").toUpperCase();

/**
 * Finds a full UK postcode inside free text. Bare outward codes ("E14") are
 * ignored here because road names like "A2" or "M25" look the same.
 */
export function postcodeFromText(text: string): string | undefined {
  const m = text.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/);
  return m ? `${m[1]}${m[2]}` : undefined;
}

/** Which fixed-price airport this place is, if any. */
export function matchFixedAirport(place: PlaceFacts): Airport | undefined {
  const pc = normalisePostcode(place.postcode ?? postcodeFromText(place.text));
  for (const [airport, p] of Object.entries(AIRPORT_PATTERNS) as [Airport, (typeof AIRPORT_PATTERNS)[Airport]][]) {
    if (p.text.test(place.text) || (pc && p.postcode.test(pc))) return airport;
  }
  return undefined;
}

/** True for any airport (fixed-price or not). Used for pickup and drop-off extras. */
export function isAirport(place: PlaceFacts): boolean {
  return (
    matchFixedAirport(place) !== undefined ||
    (place.types ?? []).includes("airport") ||
    OTHER_AIRPORT_TEXT.test(place.text)
  );
}

/** True when the place is in the E14 postcode district. */
export function isE14(place: PlaceFacts): boolean {
  const pc = normalisePostcode(place.postcode ?? postcodeFromText(place.text));
  // E14 followed by the inward code digit, or the bare district. Not E140... (no such district).
  if (/^E14(\d[A-Z]{2})?$/.test(pc)) return true;
  if (pc) return false;
  if (/\bE14\b/i.test(place.text)) return true;
  const t = place.text.toLowerCase();
  return E14_AREA_NAMES.some((n) => t.includes(n));
}

/** Fixed E14 -> airport fare, if this journey is one of the published routes. */
export function matchFixedRoute(pickup: PlaceFacts, dropoff: PlaceFacts): Airport | undefined {
  if (!isE14(pickup)) return undefined;
  const airport = matchFixedAirport(dropoff);
  if (!airport) return undefined;
  return FIXED_ROUTES.some((r) => r.origin === "e14" && r.airport === airport) ? airport : undefined;
}

function isNight(time: string | undefined, x: TariffExtras): boolean {
  const m = time?.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return false;
  const h = Number(m[1]);
  return x.nightStartHour > x.nightEndHour
    ? h >= x.nightStartHour || h < x.nightEndHour
    : h >= x.nightStartHour && h < x.nightEndHour;
}

/**
 * Quote for any journey. Fixed routes win; everything else uses the distance
 * tariff. Pure function: the server recalculates it again at payment.
 */
export function quoteJourney(req: DistanceQuoteRequest, extras: TariffExtras = TARIFF_EXTRAS): DistanceQuote {
  const fixed = matchFixedRoute(req.pickup, req.dropoff);
  if (fixed) {
    const route = FIXED_ROUTES.find((r) => r.airport === fixed)!;
    return { ok: true, kind: "fixed", airport: fixed, pricePence: route.pricesPence[req.vehicle] };
  }

  if (!Number.isFinite(req.distanceMeters) || req.distanceMeters <= 0) {
    return { ok: false, code: "INVALID_DISTANCE" };
  }

  const t = DISTANCE_TARIFFS[req.vehicle];
  const miles = req.distanceMeters / METRES_PER_MILE;
  const lines: FareLine[] = [
    { label: "Base fare", pence: t.baseFeePence },
    { label: `${miles.toFixed(1)} miles`, pence: Math.round(miles * t.perMilePence) },
  ];

  let journey = lines.reduce((s, l) => s + l.pence, 0);
  if (journey < t.minimumFarePence) {
    lines.splice(0, lines.length, { label: `Minimum fare (${miles.toFixed(1)} miles)`, pence: t.minimumFarePence });
    journey = t.minimumFarePence;
  }

  if (extras.nightSurchargePercent > 0 && isNight(req.time, extras)) {
    lines.push({
      label: `Night rate (+${extras.nightSurchargePercent}%)`,
      pence: Math.round((journey * extras.nightSurchargePercent) / 100),
    });
  }

  const pickupAirport = isAirport(req.pickup);
  if (pickupAirport && extras.airportPickupPence > 0) {
    lines.push({ label: "Airport meet and greet, parking", pence: extras.airportPickupPence });
  }
  if (isAirport(req.dropoff) && extras.airportDropOffPence > 0) {
    lines.push({ label: "Airport drop-off charge", pence: extras.airportDropOffPence });
  }

  const raw = lines.reduce((s, l) => s + l.pence, 0);
  const step = Math.max(1, extras.roundUpToPence);
  const pricePence = Math.ceil(raw / step) * step;

  return {
    ok: true,
    kind: "distance",
    pricePence,
    miles: Math.round(miles * 10) / 10,
    lines,
    freeWaitingMinutes: pickupAirport ? extras.freeWaitingAirportMinutes : extras.freeWaitingStandardMinutes,
  };
}
