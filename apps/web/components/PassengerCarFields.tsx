"use client";

import { useState, type ReactNode } from "react";
import { MAX_PASSENGERS, VEHICLE_CLASSES, VEHICLE_LABELS, VEHICLE_SPECS, type VehicleClass } from "@capitallanes/pricing";

/**
 * Passengers and car class. The car list only offers classes that seat the chosen
 * number of passengers. Without JavaScript every class shows and the server filters.
 * Leaving the car on "Compare all" prices every class that fits.
 */
export function PassengerCarFields({
  idPrefix,
  pax: pax0 = 1,
  car: car0 = "",
  paxIcon,
  carIcon,
}: {
  idPrefix: string;
  pax?: number;
  car?: VehicleClass | "";
  paxIcon?: ReactNode;
  carIcon?: ReactNode;
}) {
  const [pax, setPax] = useState(Math.min(Math.max(1, pax0), MAX_PASSENGERS));
  const [car, setCar] = useState<VehicleClass | "">(car0 && VEHICLE_SPECS[car0].passengers >= pax0 ? car0 : "");

  return (
    <div className="q2">
      <div className="qf">
        {paxIcon}
        <div className="field">
          <label htmlFor={`${idPrefix}-pax`}>Passengers</label>
          <select
            id={`${idPrefix}-pax`}
            name="pax"
            value={pax}
            onChange={(e) => {
              const n = Number(e.target.value);
              setPax(n);
              if (car && VEHICLE_SPECS[car].passengers < n) setCar("");
            }}
          >
            {Array.from({ length: MAX_PASSENGERS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1 passenger" : `${n} passengers`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="qf">
        {carIcon}
        <div className="field">
          <label htmlFor={`${idPrefix}-car`}>Car class</label>
          <select id={`${idPrefix}-car`} name="car" value={car} onChange={(e) => setCar(e.target.value as VehicleClass | "")}>
            <option value="">Compare all</option>
            {VEHICLE_CLASSES.map((v) => {
              const fits = VEHICLE_SPECS[v].passengers >= pax;
              return (
                <option key={v} value={v} disabled={!fits}>
                  {VEHICLE_LABELS[v]}
                  {fits ? "" : ` (up to ${VEHICLE_SPECS[v].passengers})`}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
