// Fixed fares for Capital Lane Ltd. Money is always integer pence.
// Source: price list from Emon, 20 November 2026.

export const VEHICLE_CLASSES = [
  "standard",
  "business-comfort",
  "executive",
  "luxury",
] as const;
export type VehicleClass = (typeof VEHICLE_CLASSES)[number];

export const VEHICLE_LABELS: Record<VehicleClass, string> = {
  standard: "Standard",
  "business-comfort": "Business Comfort",
  executive: "Executive",
  luxury: "Luxury",
};

export const AIRPORTS = ["heathrow", "gatwick"] as const;
export type Airport = (typeof AIRPORTS)[number];

export const AIRPORT_LABELS: Record<Airport, string> = {
  heathrow: "Heathrow Airport (LHR)",
  gatwick: "Gatwick Airport (LGW)",
};

export const ORIGINS = ["e14"] as const;
export type Origin = (typeof ORIGINS)[number];

export const ORIGIN_LABELS: Record<Origin, string> = {
  e14: "Canary Wharf & Docklands (E14)",
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
    },
  },
];

/** Date the published prices were last checked (shown on the site). */
export const PRICES_LAST_CHECKED = "2026-11-20";
