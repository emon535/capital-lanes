import type { Metadata } from "next";
import Link from "next/link";
import {
  AIRPORTS,
  AIRPORT_LABELS,
  FIRST_RIDE_DISCOUNT_PERCENT,
  MAX_PASSENGERS,
  TARIFF_EXTRAS,
  VEHICLE_CLASSES,
  VEHICLE_LABELS,
  VEHICLE_SPECS,
  firstRidePrice,
  formatPence,
  vehiclesForPassengers,
  type Airport,
  type VehicleClass,
} from "@capitallanes/pricing";
import { Arrow, Bag, Calendar, Check, Clock, Gift, Person, Pin, Plane, Users } from "@/components/home/Icons";
import { SiteFooter, SiteNav } from "@/components/home/SiteChrome";
import { PassengerCarFields } from "@/components/PassengerCarFields";
import { JourneyFields, WhenFields } from "@/components/PlaceField";
import { QuoteTabs } from "@/components/QuoteTabs";
import { CONTACT, VEHICLES, fleetPhoto } from "@/content/site";
import { askEnabled } from "@/lib/ask";
import { quoteForJourney, type ClassQuote } from "@/lib/journey-quote";

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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function QuotePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  // Older links send ?airport=heathrow. The old ?from=e14 sample pickup is ignored.
  const legacyAirport = AIRPORTS.find((a) => a === one(sp.airport)) as Airport | undefined;
  const fromParam = one(sp.from);
  const from = fromParam === "e14" ? undefined : fromParam;
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
  const pax = Number.isInteger(paxN) && paxN > 0 && paxN < 100 ? paxN : 1;
  const tooMany = pax > MAX_PASSENGERS;
  const bagsN = Number(one(sp.bags));
  const bags = Number.isInteger(bagsN) && bagsN >= 0 && bagsN < 100 ? String(bagsN) : undefined;
  const note = one(sp.note);

  const fitting = vehiclesForPassengers(pax);
  const result =
    from && to && !review && !tooMany
      ? await quoteForJourney({ from, fromId, to, toId, vehicles: fitting, time, sessionToken: session })
      : null;

  const changeHref = `/quote?${new URLSearchParams(
    Object.entries({ from, fromId, to, toId, date, time, pax: String(pax), car, bags, note }).filter(
      (e): e is [string, string] => !!e[1],
    ),
  )}`;

  const offers = result?.ok
    ? fitting.flatMap((v) => (result.quotes[v] ? [[v, result.quotes[v]] as [VehicleClass, ClassQuote]] : []))
    : [];
  // A chosen class that is too small for the group is dropped, and we say so.
  const carTooSmall = car && !fitting.includes(car);
  const firstQuote = offers[0]?.[1];

  return (
    <>
      <header className="hero" style={{ minHeight: 0, padding: "104px 0 0" }}>
        <SiteNav />
      </header>
      <main className="sec qpage">
        <div className="wrap" style={{ maxWidth: offers.length ? 1160 : 720 }}>
          {offers.length > 0 && result?.ok ? (
            <section className="qres2" aria-labelledby="qres-title">
              <aside className="qtrip">
                <p className="eyebrow">Your journey</p>
                <h1 id="qres-title" className="sr-only">
                  Choose your car
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
                  <li>{plural(pax, "passenger", "passengers")}</li>
                  {bags && <li>{plural(Number(bags), "bag", "bags")}</li>}
                  {note && <li>{note}</li>}
                  {result.route && (
                    <li>
                      {(result.route.distanceMeters / 1609.344).toFixed(1)} mi, about{" "}
                      {formatDuration(result.route.durationSeconds)}
                    </li>
                  )}
                </ul>
                <Link href={changeHref} className="btn btn-dark">
                  Change journey
                </Link>
                {FIRST_RIDE_DISCOUNT_PERCENT > 0 && (
                  <div className="first-ride-box">
                    <Gift size={22} strokeWidth={1.4} />
                    <div>
                      <b>{FIRST_RIDE_DISCOUNT_PERCENT}% off your first ride</b>
                      <p>
                        New to Capital Lane? Say it is your first journey when you book and we take{" "}
                        {FIRST_RIDE_DISCOUNT_PERCENT}% off. One first ride per customer and phone number.
                      </p>
                    </div>
                  </div>
                )}
                {firstQuote?.kind === "distance" && (
                  <details className="breakdown">
                    <summary>How we price ({VEHICLE_LABELS[offers[0][0]]})</summary>
                    {firstQuote.lines.map((l) => (
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
              </aside>

              <div className="qcars">
                <p className="eyebrow">Choose your car</p>
                {FIRST_RIDE_DISCOUNT_PERCENT > 0 && (
                  <p className="first-ride">
                    <Gift size={16} /> New customers: {FIRST_RIDE_DISCOUNT_PERCENT}% off your first ride, just ask when you
                    book
                  </p>
                )}
                {carTooSmall && (
                  <p className="review-note" role="status">
                    The {VEHICLE_LABELS[car]} seats up to {VEHICLE_SPECS[car].passengers}, so here are the cars for{" "}
                    {plural(pax, "passenger", "passengers")}.
                  </p>
                )}
                <ul className="offers">
                  {offers.map(([v, q]) => {
                    const info = VEHICLES[v];
                    const spec = VEHICLE_SPECS[v];
                    const chosen = v === car;
                    return (
                      <li key={v} className={chosen ? "offer chosen" : "offer"}>
                        <div className="ph">
                          {/* Unsplash serves resized images itself, so a plain img is enough here. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fleetPhoto(info, 480, 300)}
                            srcSet={`${fleetPhoto(info, 480, 300)} 1x, ${fleetPhoto(info, 960, 600)} 2x`}
                            alt={info.photoAlt}
                            width={480}
                            height={300}
                            loading="lazy"
                          />
                          {chosen && <span className="tag">Your choice</span>}
                        </div>
                        <div className="info">
                          <h2>{VEHICLE_LABELS[v]}</h2>
                          <p className="model">{info.model}</p>
                          <ul className="cap">
                            <li>
                              <Users size={15} /> Up to {spec.passengers}
                            </li>
                            <li>
                              <Bag size={15} /> {spec.suitcases} cases + {spec.handLuggage} small
                            </li>
                          </ul>
                        </div>
                        <div className="fare">
                          <p className="price">{formatPence(q.pricePence)}</p>
                          {FIRST_RIDE_DISCOUNT_PERCENT > 0 && (
                            <p className="first">
                              {formatPence(firstRidePrice(q.pricePence))} <span>first ride</span>
                            </p>
                          )}
                          <p className="lbl">All-in, one way</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <ul className="ticks">
                  {[
                    "VAT included",
                    "Parking and drop-off charges included",
                    firstQuote?.kind === "distance"
                      ? `${firstQuote.freeWaitingMinutes} min free waiting`
                      : `${TARIFF_EXTRAS.freeWaitingAirportMinutes} min free waiting`,
                    "Price fixed at booking",
                    "Invoice on request",
                  ].map((t) => (
                    <li key={t} className="text-gold">
                      <Check /> <span className="text-t2">{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="book-now">
                  <p>
                    Online booking is coming soon. To book, <a href={CONTACT.phoneHref}>call {CONTACT.phoneDisplay}</a> or{" "}
                    <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                      message us on WhatsApp
                    </a>{" "}
                    with your journey and the car you want.
                  </p>
                </div>
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
              {tooMany && (
                <p className="review-note" role="status">
                  Our largest car seats {MAX_PASSENGERS}. For {pax} passengers we can send two cars: call{" "}
                  <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a> or{" "}
                  <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                    message us on WhatsApp
                  </a>{" "}
                  for a price.
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
                      : "Our live route pricing is offline for a moment."}{" "}
                    You can also call us on <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a> for a price.
                  </p>
                </div>
              )}
              <div className="quote" style={{ marginTop: 32, maxWidth: "none" }}>
                <QuoteTabs askEnabled={askEnabled()}>
                  <form action="/quote" method="get" className="body" style={{ paddingTop: 28 }}>
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
                    <PassengerCarFields
                      idPrefix="p"
                      pax={Math.min(pax, MAX_PASSENGERS)}
                      car={car ?? ""}
                      paxIcon={<Users />}
                      carIcon={<Person />}
                    />
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
