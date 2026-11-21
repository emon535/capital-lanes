import {
  AIRPORT_LABELS,
  FIXED_ROUTES,
  ORIGIN_LABELS,
  PRICES_LAST_CHECKED,
  VEHICLE_CLASSES,
  VEHICLE_LABELS,
  formatPence,
} from "@capitallanes/pricing";

const checked = new Date(PRICES_LAST_CHECKED).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

/** Server-rendered fare table, readable without JavaScript. */
export function FareTable() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <table className="w-full min-w-[560px] text-left">
        <caption className="sr-only">
          Fixed one-way fares from {ORIGIN_LABELS.e14} by vehicle class
        </caption>
        <thead className="bg-ink text-white">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Route
            </th>
            {VEHICLE_CLASSES.map((v) => (
              <th key={v} scope="col" className="px-4 py-3 text-right font-semibold">
                {VEHICLE_LABELS[v]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FIXED_ROUTES.map((route) => (
            <tr key={`${route.origin}-${route.airport}`} className="border-t border-slate-100">
              <th scope="row" className="px-4 py-4 font-medium">
                E14 to {AIRPORT_LABELS[route.airport]}
              </th>
              {VEHICLE_CLASSES.map((v) => (
                <td key={v} className="px-4 py-4 text-right text-lg font-semibold tabular-nums">
                  {formatPence(route.pricesPence[v])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-3 text-sm text-muted">
        One-way fares. Includes VAT, parking and the airport drop-off charge. Prices last checked{" "}
        {checked}.
      </p>
    </div>
  );
}
