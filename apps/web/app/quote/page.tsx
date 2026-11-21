import type { Metadata } from "next";
import Link from "next/link";
import {
  AIRPORTS,
  AIRPORT_LABELS,
  ORIGIN_LABELS,
  TARIFF_EXTRAS,
  VEHICLE_CLASSES,
  VEHICLE_LABELS,
  formatPence,
  type Airport,
  type VehicleClass,
} from "@capitallanes/pricing";
import { Arrow, Calendar, Check, Clock, Person, Pin, Plane } from "@/components/home/Icons";
import { SiteFooter, SiteNav } from "@/components/home/SiteChrome";
import { JourneyFields, WhenFields } from "@/components/PlaceField";
import { QuoteTabs } from "@/components/QuoteTabs";
import { CONTACT } from "@/content/site";
import { askEnabled } from "@/lib/ask";
import { quoteForJourney } from "@/lib/journey-quote";

export const metadata: Metadata = {
  title: "Your price",
  robots: { index: false },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => {
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s.slice(0, 200) : undefined;
};

function formatWhen(date?: string, time?: string) {
  if (!date) return time ? `at ${time}` : "Date to confirm";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Date to confirm";
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return time ? `${day}, ${time}` : day;
}

function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export default async function QuotePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  // Older links (homepage, fleet and route cards) send ?from=e14 and ?airport=heathrow.
  const legacyAirport = AIRPORTS.find((a) => a === one(sp.airport)) as Airport | undefined;
  const fromParam = one(sp.from);
  const from = fromParam === "e14" ? ORIGIN_LABELS.e14 : fromParam;
  const to = one(sp.to) ?? (legacyAirport ? AIRPORT_LABELS[legacyAirport] : undefined);
  const fromId = one(sp.fromId);
  const toId = one(sp.toId);
  const car = VEHICLE_CLASSES.find((v) => v === one(sp.car)) as VehicleClass | undefined;
  const date = one(sp.date);
  const time = one(sp.time);
  const session = one(sp.s);
  // From "Just ask me": the form is filled in for the customer to check before pricing.
  const review = one(sp.review) === "1";
  const paxN = Number(one(sp.pax));
  const pax = Number.isInteger(paxN) && paxN > 0 && paxN < 100 ? String(paxN) : undefined;
  const bagsN = Number(one(sp.bags));
  const bags = Number.isInteger(bagsN) && bagsN >= 0 && bagsN < 100 ? String(bagsN) : undefined;
  const note = one(sp.note);

  const result =
    from && to && car && !review
      ? await quoteForJourney({ from, fromId, to, toId, vehicle: car, time, sessionToken: session })
      : null;

  const changeHref = `/quote?${new URLSearchParams(
    Object.entries({ from, fromId, to, toId, date, time, pax, bags, note }).filter((e): e is [string, string] => !!e[1]),
  )}`;

  return (
    <>
      <header className="hero" style={{ minHeight: 0, padding: result?.ok ? "84px 0 0" : "104px 0 0" }}>
        <SiteNav />
      </header>
      <main className={result?.ok ? "sec qpage done" : "sec qpage"}>
        <div className="wrap" style={{ maxWidth: result?.ok ? 1040 : 720 }}>
          {result?.ok && car ? (
            <section className="qres" aria-labelledby="qres-title">
              <div className="qres-trip">
                <p className="eyebrow">Your quote</p>
                <h1 id="qres-title" className="sr-only">
                  Your fare
                </h1>
                <ol className="trip">
                  <li>
                    <span>Pick-up</span>
                    <b>{from}</b>
                  </li>
                  <li>
                    <span>Drop-off</span>
                    <b>{to}</b>
                  </li>
                </ol>
                <ul className="meta">
                  <li>{formatWhen(date, time)}</li>
                  <li>{VEHICLE_LABELS[car]}</li>
                  {pax && <li>{pax === "1" ? "1 passenger" : `${pax} passengers`}</li>}
                  {bags && <li>{bags === "1" ? "1 bag" : `${bags} bags`}</li>}
                  {note && <li>{note}</li>}
                  {result.route && (
                    <li>
                      {(result.route.distanceMeters / 1609.344).toFixed(1)} mi, about{" "}
                      {formatDuration(result.route.durationSeconds)}
                    </li>
                  )}
                </ul>
                {result.quote.kind === "distance" && (
                  <details className="breakdown">
                    <summary>Price breakdown</summary>
                    {result.quote.lines.map((l) => (
                      <div className="row" key={l.label}>
                        <span>{l.label}</span>
                        <b>{formatPence(l.pence)}</b>
                      </div>
                    ))}
                    <p className="note">
                      Waiting beyond the free time is {formatPence(TARIFF_EXTRAS.waitingPerMinutePence)} a minute. Extra
                      stops change the route, so add them when you book.
                    </p>
                  </details>
                )}
              </div>
              <div className="qres-price">
                <p className="lbl">
                  {result.quote.kind === "fixed" ? "Fixed route fare, one way" : "All-in fare, one way"}
                </p>
                <p className="price" aria-live="polite">
                  {formatPence(result.quote.pricePence)}
                </p>
                <ul className="ticks">
                  {(result.quote.kind === "fixed"
                    ? ["VAT included", "Parking and drop-off included", "60 min free waiting", "No surge"]
                    : ["VAT included", `${result.quote.freeWaitingMinutes} min free waiting`, "Price fixed at booking", "No surge"]
                  ).map((t) => (
                    <li key={t} className="text-gold">
                      <Check /> <span className="text-t2">{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="acts">
                  <Link href={changeHref} className="btn btn-dark">
                    Change journey
                  </Link>
                </div>
                <p className="note">Online booking is coming soon. Call <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a> or{" "}
                  <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">message us on WhatsApp</a> to book now.</p>
              </div>
            </section>
          ) : (
            <>
              <p className="eyebrow">Instant quote</p>
              <h1 className="h2">
                Calculate your <em>price.</em>
              </h1>
              {review && (
                <p className="review-note" role="status">
                  We filled this in from your message. Please check it, then calculate your price.
                  {note ? ` Noted: ${note}.` : ""}
                </p>
              )}
              {result && !result.ok && (
                <div className="result" role="alert" style={{ marginTop: 32 }}>
                  <p className="text-t1" style={{ fontSize: 16 }}>
                    We could not price this journey online just now.
                  </p>
                  <p className="note" style={{ marginTop: 8 }}>
                    {result.reason === "NO_ROUTE"
                      ? "Please check both addresses, or pick one from the suggestions as you type."
                      : "Our live route pricing is offline. Fixed fares from Canary Wharf (E14) to Heathrow and Gatwick still work."}{" "}
                    You can also call us on <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a> for a price.
                  </p>
                </div>
              )}
              <div className="quote" style={{ marginTop: 32, maxWidth: "none" }}>
              <QuoteTabs askEnabled={askEnabled()}>
              <form action="/quote" method="get" className="body" style={{ paddingTop: 28 }}>
                  {pax && <input type="hidden" name="pax" value={pax} />}
                  {bags && <input type="hidden" name="bags" value={bags} />}
                  {note && <input type="hidden" name="note" value={note} />}
                  <JourneyFields
                    from={from}
                    fromId={fromId}
                    to={to}
                    toId={toId}
                    fromIcon={<Pin />}
                    toIcon={<Plane />}
                  />
                  <WhenFields idPrefix="p" date={date} time={time} dateIcon={<Calendar />} timeIcon={<Clock />} />
                  <div className="qf">
                    <Person />
                    <div className="field">
                      <label htmlFor="p-car">Car class</label>
                      <select id="p-car" name="car" required defaultValue={car ?? "standard"}>
                        <option value="" disabled>
                          Standard to Luxury
                        </option>
                        {VEHICLE_CLASSES.map((v) => (
                          <option key={v} value={v}>
                            {VEHICLE_LABELS[v]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-gold">
                    Calculate my price <Arrow />
                  </button>
              </form>
              </QuoteTabs>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
