import { FIXED_ROUTES, type Airport, type Origin, type VehicleClass } from "./fares";

export interface QuoteRequest {
  origin: Origin;
  airport: Airport;
  vehicle: VehicleClass;
}

export type QuoteResult =
  | { ok: true; pricePence: number }
  | { ok: false; code: "ROUTE_NOT_PRICED" };

/** Fixed one-way fare. Pure function: the API will call this again at payment. */
export function quoteFixedFare(req: QuoteRequest): QuoteResult {
  const route = FIXED_ROUTES.find(
    (r) => r.origin === req.origin && r.airport === req.airport,
  );
  if (!route) return { ok: false, code: "ROUTE_NOT_PRICED" };
  return { ok: true, pricePence: route.pricesPence[req.vehicle] };
}

const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const gbpPence = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** 9000 -> "£90", 9050 -> "£90.50" */
export function formatPence(pence: number): string {
  return pence % 100 === 0 ? gbpWhole.format(pence / 100) : gbpPence.format(pence / 100);
}
