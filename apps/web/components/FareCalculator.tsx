"use client";

import { useId, useState } from "react";
import {
  AIRPORTS,
  AIRPORT_LABELS,
  ORIGIN_LABELS,
  VEHICLE_CLASSES,
  VEHICLE_LABELS,
  formatPence,
  quoteFixedFare,
  type Airport,
  type VehicleClass,
} from "@capitallanes/pricing";

export function FareCalculator() {
  const [airport, setAirport] = useState<Airport>("heathrow");
  const [vehicle, setVehicle] = useState<VehicleClass>("standard");
  const airportId = useId();

  const quote = quoteFixedFare({ origin: "e14", airport, vehicle });

  return (
    <div className="rounded-2xl bg-white p-6 text-ink shadow-xl ring-1 ring-black/5 sm:p-8">
      <h2 className="text-lg font-semibold">Get your fixed price</h2>

      <div className="mt-5 grid gap-4">
        <div>
          <span className="block text-sm font-medium text-muted">From</span>
          <p className="mt-1 rounded-lg border border-slate-200 bg-paper px-3 py-2.5">
            {ORIGIN_LABELS.e14}
          </p>
        </div>

        <div>
          <label htmlFor={airportId} className="block text-sm font-medium text-muted">
            To
          </label>
          <select
            id={airportId}
            value={airport}
            onChange={(e) => setAirport(e.target.value as Airport)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-ink focus:outline-none focus:ring-2 focus:ring-brass"
          >
            {AIRPORTS.map((a) => (
              <option key={a} value={a}>
                {AIRPORT_LABELS[a]}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-muted">Vehicle</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {VEHICLE_CLASSES.map((v) => {
              const selected = v === vehicle;
              return (
                <label
                  key={v}
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    selected
                      ? "border-ink bg-ink text-white"
                      : "border-slate-300 bg-white hover:border-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={v}
                    checked={selected}
                    onChange={() => setVehicle(v)}
                    className="sr-only"
                  />
                  {VEHICLE_LABELS[v]}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div
        className="mt-6 flex items-end justify-between rounded-xl bg-brass-soft px-4 py-4"
        aria-live="polite"
      >
        <div>
          <p className="text-sm text-muted">One way, all-in</p>
          <p className="text-sm font-medium">{VEHICLE_LABELS[vehicle]}</p>
        </div>
        <p className="text-4xl font-bold tracking-tight">
          {quote.ok ? formatPence(quote.pricePence) : "Call us"}
        </p>
      </div>

      <a
        href="#prices"
        className="mt-4 block rounded-lg bg-ink px-4 py-3 text-center font-semibold text-white hover:bg-ink-soft"
      >
        See all fares
      </a>
      <p className="mt-3 text-center text-xs text-muted">
        Online booking is coming soon. Price includes VAT, parking and drop-off charge.
      </p>
    </div>
  );
}
