import "server-only";

// Google Places API (New) and Routes API, called from the server only.
// The key lives in GOOGLE_MAPS_API_KEY (apps/web/.env.local) and never reaches the browser.
// With no key, or if Google fails, every function returns null and the site falls back.

const PLACES = "https://places.googleapis.com/v1";
const ROUTES = "https://routes.googleapis.com/directions/v2:computeRoutes";
const TIMEOUT_MS = 6000;

/** Central London, used to bias suggestions. */
const LONDON = { latitude: 51.5072, longitude: -0.1276 };

export function mapsKey(): string | null {
  const k = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return k && !/^(your|placeholder|changeme)/i.test(k) ? k : null;
}

export const mapsEnabled = () => mapsKey() !== null;

async function call<T>(url: string, init: RequestInit & { fieldMask?: string }): Promise<T | null> {
  const key = mapsKey();
  if (!key) return null;
  const { fieldMask, ...rest } = init;
  try {
    const res = await fetch(url, {
      ...rest,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        ...(fieldMask ? { "X-Goog-FieldMask": fieldMask } : {}),
      },
    });
    if (!res.ok) {
      console.error(`[google] ${new URL(url).pathname} -> ${res.status} ${(await res.text()).slice(0, 300)}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[google] ${new URL(url).pathname} failed`, err);
    return null;
  }
}

export interface Suggestion {
  placeId: string;
  /** Full line to put in the input. */
  text: string;
  main: string;
  secondary: string;
}

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
    };
  }>;
}

export async function autocomplete(input: string, sessionToken?: string): Promise<Suggestion[] | null> {
  const data = await call<AutocompleteResponse>(`${PLACES}/places:autocomplete`, {
    method: "POST",
    body: JSON.stringify({
      input,
      sessionToken,
      includedRegionCodes: ["gb"],
      languageCode: "en-GB",
      regionCode: "gb",
      locationBias: { circle: { center: LONDON, radius: 50000 } },
    }),
  });
  if (!data) return null;
  return (data.suggestions ?? []).flatMap((s) => {
    const p = s.placePrediction;
    if (!p?.placeId) return [];
    const main = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
    const secondary = p.structuredFormat?.secondaryText?.text ?? "";
    return [{ placeId: p.placeId, text: p.text?.text ?? main, main, secondary }];
  });
}

export interface PlaceDetails {
  text: string;
  postcode?: string;
  types: string[];
}

interface DetailsResponse {
  formattedAddress?: string;
  displayName?: { text: string };
  types?: string[];
  addressComponents?: Array<{ longText: string; types: string[] }>;
}

export async function placeDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails | null> {
  if (!/^[\w-]{10,300}$/.test(placeId)) return null;
  const qs = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
  const d = await call<DetailsResponse>(`${PLACES}/places/${placeId}${qs}`, {
    method: "GET",
    fieldMask: "displayName,formattedAddress,types,addressComponents",
  });
  if (!d) return null;
  const name = d.displayName?.text ?? "";
  const addr = d.formattedAddress ?? "";
  return {
    text: addr.startsWith(name) ? addr : [name, addr].filter(Boolean).join(", "),
    postcode: d.addressComponents?.find((c) => c.types.includes("postal_code"))?.longText,
    types: d.types ?? [],
  };
}

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
}

type Waypoint = { placeId: string } | { address: string };

interface RoutesResponse {
  routes?: Array<{ distanceMeters?: number; duration?: string; routeLabels?: string[] }>;
}

/** Shortest driving distance plus typical drive time. Uses no live traffic, so the price is stable. */
export async function drivingRoute(origin: Waypoint, destination: Waypoint): Promise<RouteInfo | null> {
  const data = await call<RoutesResponse>(ROUTES, {
    method: "POST",
    fieldMask: "routes.distanceMeters,routes.duration,routes.routeLabels",
    body: JSON.stringify({
      origin,
      destination,
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      computeAlternativeRoutes: true,
      requestedReferenceRoutes: ["SHORTER_DISTANCE"],
      units: "IMPERIAL",
      regionCode: "gb",
      languageCode: "en-GB",
    }),
  });
  // Price on the shortest route Google knows (its SHORTER_DISTANCE reference route), not the
  // fastest one: the fastest can be a long motorway loop (Canary Wharf to Gatwick is ~50 miles
  // via the M25 against ~32 via the A23). Show the drive time of Google's default route.
  const routes = (data?.routes ?? []).filter((x) => (x.distanceMeters ?? 0) > 0);
  const r = [...routes].sort((a, b) => a.distanceMeters! - b.distanceMeters!)[0];
  if (!r?.distanceMeters) return null;
  const main = routes.find((x) => x.routeLabels?.includes("DEFAULT_ROUTE")) ?? r;
  return { distanceMeters: r.distanceMeters, durationSeconds: Number.parseInt(main.duration ?? "0", 10) || 0 };
}

export interface ReversePlace {
  placeId: string;
  text: string;
}

/**
 * Street address for the customer's current position ("Use my location").
 * Tries the Geocoding API first; if the key is not allowed to use it, falls back to
 * the nearest place from Places API (New).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReversePlace | null> {
  const key = mapsKey();
  if (!key) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en-GB&result_type=street_address|premise|route&key=${key}`,
      { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    const d = (await res.json()) as { status: string; results?: Array<{ place_id: string; formatted_address: string }> };
    const r = d.results?.[0];
    if (d.status === "OK" && r) return { placeId: r.place_id, text: r.formatted_address.replace(/, UK$/, "") };
    if (d.status !== "ZERO_RESULTS") console.error(`[google] geocode -> ${d.status}`);
  } catch (err) {
    console.error("[google] geocode failed", err);
  }

  const near = await call<{ places?: Array<{ id: string; formattedAddress?: string }> }>(`${PLACES}/places:searchNearby`, {
    method: "POST",
    fieldMask: "places.id,places.formattedAddress",
    body: JSON.stringify({
      maxResultCount: 1,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 200 } },
    }),
  });
  const p = near?.places?.[0];
  return p?.formattedAddress ? { placeId: p.id, text: p.formattedAddress.replace(/, UK$/, "") } : null;
}
