import "server-only";

import {
  FIXED_ROUTES,
  matchFixedRoute,
  quoteJourney,
  type DistanceQuote,
  type PlaceFacts,
  type VehicleClass,
} from "@capitallanes/pricing";
import { drivingRoute, mapsEnabled, placeDetails, type RouteInfo } from "./google";

export interface JourneyInput {
  from: string;
  fromId?: string;
  to: string;
  toId?: string;
  vehicle: VehicleClass;
  time?: string;
  sessionToken?: string;
}

export type JourneyQuote =
  | {
      ok: true;
      quote: Extract<DistanceQuote, { ok: true }>;
      pickup: PlaceFacts;
      dropoff: PlaceFacts;
      route: RouteInfo | null;
    }
  | {
      ok: false;
      /** NO_ROUTE: Google could not find a driving route. UNAVAILABLE: no key, or Google is down. */
      reason: "NO_ROUTE" | "UNAVAILABLE";
      pickup: PlaceFacts;
      dropoff: PlaceFacts;
    };

const validId = (id?: string) => (id && /^[\w-]{10,300}$/.test(id) ? id : undefined);

/** Works out the fare on the server. Never trust a price sent from the browser. */
export async function quoteForJourney(input: JourneyInput): Promise<JourneyQuote> {
  const fromId = validId(input.fromId);
  const toId = validId(input.toId);

  const [fromDetails, toDetails, route] = await Promise.all([
    fromId ? placeDetails(fromId, input.sessionToken) : null,
    toId ? placeDetails(toId, input.sessionToken) : null,
    mapsEnabled()
      ? drivingRoute(
          fromId ? { placeId: fromId } : { address: input.from },
          toId ? { placeId: toId } : { address: input.to },
        )
      : null,
  ]);

  // Keep what the customer saw in the box, and add Google's postcode and place types.
  const pickup: PlaceFacts = {
    text: fromDetails ? `${input.from} | ${fromDetails.text}` : input.from,
    postcode: fromDetails?.postcode,
    types: fromDetails?.types,
  };
  const dropoff: PlaceFacts = {
    text: toDetails ? `${input.to} | ${toDetails.text}` : input.to,
    postcode: toDetails?.postcode,
    types: toDetails?.types,
  };

  if (route) {
    const q = quoteJourney({
      vehicle: input.vehicle,
      distanceMeters: route.distanceMeters,
      pickup,
      dropoff,
      time: input.time,
    });
    if (q.ok) return { ok: true, quote: q, pickup, dropoff, route };
  }

  // Fallback: the published fixed routes need no distance at all.
  const airport = matchFixedRoute(pickup, dropoff);
  if (airport) {
    const r = FIXED_ROUTES.find((x) => x.airport === airport)!;
    return {
      ok: true,
      quote: { ok: true, kind: "fixed", airport, pricePence: r.pricesPence[input.vehicle] },
      pickup,
      dropoff,
      route,
    };
  }

  return { ok: false, reason: mapsEnabled() && route === null ? "NO_ROUTE" : "UNAVAILABLE", pickup, dropoff };
}
