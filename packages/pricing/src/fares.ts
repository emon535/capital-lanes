// Fixed fares for Capital Lane Ltd. Money is always integer pence.
// Source: price list from Emon, 20 November 2026.

export const VEHICLE_CLASSES = [
  "standard",
  "business-comfort",
  "executive",
  "luxury",
  "mpv",
] as const;
export type VehicleClass = (typeof VEHICLE_CLASSES)[number];

export const VEHICLE_LABELS: Record<VehicleClass, string> = {
  standard: "Standard",
  "business-comfort": "Business Comfort",
  executive: "Executive",
  luxury: "Luxury",
  mpv: "MPV",
};

export interface VehicleSpec {
  /** Most passengers the class can carry (the calculator hides classes that are too small). */
  passengers: number;
  /** Large suitcases plus cabin bags, as shown to the customer. */
  suitcases: number;
  handLuggage: number;
}

// Capacities: SUGGESTED, waiting for Emon to confirm (28 Nov 2026).
export const VEHICLE_SPECS: Record<VehicleClass, VehicleSpec> = {
  standard: { passengers: 4, suitcases: 2, handLuggage: 2 },
  "business-comfort": { passengers: 4, suitcases: 3, handLuggage: 2 },
  executive: { passengers: 3, suitcases: 2, handLuggage: 2 },
  luxury: { passengers: 3, suitcases: 2, handLuggage: 2 },
  mpv: { passengers: 6, suitcases: 6, handLuggage: 4 },
};

export const MAX_PASSENGERS = Math.max(...Object.values(VEHICLE_SPECS).map((s) => s.passengers));

/** Classes that can carry this many passengers, smallest first (class order). */
export function vehiclesForPassengers(passengers: number): VehicleClass[] {
  const n = Number.isFinite(passengers) && passengers > 0 ? Math.floor(passengers) : 1;
  return VEHICLE_CLASSES.filter((v) => VEHICLE_SPECS[v].passengers >= n);
}

export const AIRPORTS = ["heathrow", "gatwick"] as const;
export type Airport = (typeof AIRPORTS)[number];

export const AIRPORT_LABELS: Record<Airport, string> = {
  heathrow: "Heathrow Airport (LHR)",
  gatwick: "Gatwick Airport (LGW)",
};

export const ORIGINS = ["e14"] as const;
export type Origin = (typeof ORIGINS)[number];

/** Internal only: the price list was set for pickups in the E14 postcode district. Not shown on the site. */
export const ORIGIN_LABELS: Record<Origin, string> = {
  e14: "E14, London",
};

export interface FixedRoute {
  origin: Origin;
  airport: Airport;
  pricesPence: Record<VehicleClass, number>;
}

export const FIXED_ROUTES: readonly FixedRoute[] = [
  {
    origin: "e14",
    airport: "heathrow",
    pricesPence: {
      standard: 9000,
      "business-comfort": 11000,
      executive: 13000,
      luxury: 15000,
      mpv: 12000, // SUGGESTED, waiting for Emon (28 Nov 2026)
    },
  },
  {
    origin: "e14",
    airport: "gatwick",
    pricesPence: {
      standard: 11000,
      "business-comfort": 13000,
      executive: 15000,
      luxury: 18000,
      mpv: 14000, // SUGGESTED, waiting for Emon (28 Nov 2026)
    },
  },
];

/** Date the published prices were last checked (shown on the site). */
export const PRICES_LAST_CHECKED = "2026-11-20";
