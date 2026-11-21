import Image from "next/image";
import Link from "next/link";
import { VEHICLE_CLASSES, VEHICLE_LABELS } from "@capitallanes/pricing";
import { Car } from "@/components/home/Car";
import {
  Arrow,
  Board,
  Calendar,
  Card,
  Check,
  Clock,
  Person,
  Phone,
  Pin,
  Plane,
  Pound,
  Seat,
  Shield,
  Star,
} from "@/components/home/Icons";
import { QuoteForm } from "@/components/home/QuoteForm";
import { ScrollRoad } from "@/components/home/ScrollRoad";
import "@/components/home/glow.css";
import { SiteFooter, SiteNav } from "@/components/home/SiteChrome";
import { Skyline } from "@/components/home/Skyline";
import {
  COMPANY,
  CONTACT,
  HOW_IT_WORKS,
  PROMISE,
  ROUTES,
  SAMPLE_REVIEWS,
  SIGNATURE_LINE,
  SITE_URL,
  VEHICLE_DESCRIPTIONS,
} from "@/content/site";

// Homepage rule: no prices or calculated fares here. Every price CTA leads to /quote.

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: COMPANY.legalName,
  url: SITE_URL,
  description: COMPANY.tagline,
  areaServed: "London",
  telephone: CONTACT.phoneE164,
};

const PROMISE_ICONS = [Pound, Clock, Plane, Board, Calendar, Seat];

const CAR_STYLES: Record<
  (typeof VEHICLE_CLASSES)[number],
  { top: string; bottom: string; hub: string; featured?: boolean }
> = {
  standard: { top: "#3a3a3a", bottom: "#141414", hub: "#8d8d8d" },
  "business-comfort": { top: "#2e2e2e", bottom: "#0e0e0e", hub: "#b4b4b4" },
  executive: { top: "#222", bottom: "#060606", hub: "#d6d6d6", featured: true },
  luxury: { top: "#161616", bottom: "#000", hub: "#D4B06A" },
};

const ROMAN = ["i.", "ii.", "iii."];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="hero">
        <SiteNav />
        <div className="hero-scene" aria-hidden="true">
          <div className="sky">
            <Skyline />
          </div>
          <div className="road" />
          <div className="lane" />
          <div className="shade" />
          <div className="car">
            <Car
              id="hero"
              width={720}
              viewBoxWidth={570}
              bodyTop="#262626"
              bodyBottom="#020202"
              glass="#2e2e2e"
              hub="#cfcfcf"
              headlightBeam
            />
          </div>
        </div>

        <div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Private chauffeur · Canary Wharf · London</p>
            <h1>
              The quiet way
              <br />
              to <em>the airport.</em>
            </h1>
            <p className="lead">
              Chauffeur-driven transfers from Canary Wharf to Heathrow and Gatwick. A fixed, all-in fare, your
              name on a board in arrivals and an hour of free waiting.
            </p>
            <div className="ctas">
              <Link href="#quote" className="btn btn-gold">
                Calculate your price <Arrow />
              </Link>
              <Link href="#fleet" className="btn btn-dark">
                View the fleet
              </Link>
            </div>
            <ul className="ticks">
              {["Fixed, all-in fare", "Flight tracked", "Free cancellation 24 h"].map((t) => (
                <li key={t} className="text-gold">
                  <Check /> <span className="text-t2">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <QuoteForm />
        </div>
      </header>

      <main className="journey">
        <ScrollRoad />
        <section className="strip" aria-label="Included with every journey">
          <ul className="wrap">
            {PROMISE.map((item, i) => {
              const Icon = PROMISE_ICONS[i] ?? Check;
              return (
                <li key={item.title}>
                  <Icon size={24} strokeWidth={1.3} />
                  <b>{item.title}</b>
                  <span>{item.body}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="sec routes" id="routes" aria-labelledby="routes-title">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="eyebrow">Airport transfers</p>
                <h2 className="h2" id="routes-title">
                  Your fare, fixed
                  <br />
                  <em>before</em> you book.
                </h2>
              </div>
              <p>
                Tell us where and when, and we calculate one all-in price for your car. VAT, parking and the
                airport drop-off charge are already included. Nothing is added later.
              </p>
            </div>
            <div className="rgrid">
              {ROUTES.map((r) => (
                <article className="route" key={r.code}>
                  <div className="code" aria-hidden="true">
                    {r.code}
                  </div>
                  <p className="from">From Canary Wharf · E14</p>
                  <h3>
                    Canary Wharf <i aria-hidden="true">→</i>
                    <span className="sr-only"> to </span> {r.name}
                  </h3>
                  <div className="meta">
                    <div>
                      Typical journey<b>{r.journey}</b>
                    </div>
                    <div>
                      Terminals<b>{r.terminals}</b>
                    </div>
                    <div>
                      Car classes<b>Four</b>
                    </div>
                  </div>
                  <Link href={`/quote?from=e14&airport=${r.airport}`} className="btn btn-gold">
                    Calculate my {r.name} fare <Arrow />
                  </Link>
                </article>
              ))}
            </div>
            <ul className="incl">
              {[
                "VAT included",
                "Parking included",
                "Drop-off charge included",
                "60 min free waiting",
                "No surge pricing",
              ].map((t) => (
                <li key={t}>
                  <span className="text-gold">
                    <Check />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sec fleet" id="fleet" aria-labelledby="fleet-title">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="eyebrow">The fleet</p>
                <h2 className="h2" id="fleet-title">
                  Four classes.
                  <br />
                  One <em>standard.</em>
                </h2>
              </div>
              <p>
                {SIGNATURE_LINE} Every car is ours, cleaned before each journey and driven by a TfL-licensed,
                DBS-checked chauffeur in business dress.
              </p>
            </div>
            <ul className="cars">
              {VEHICLE_CLASSES.map((v, i) => {
                const s = CAR_STYLES[v];
                return (
                  <li key={v} className={`carc${s.featured ? " feat" : ""}`}>
                    {s.featured && <span className="tag">Most requested</span>}
                    <span className="num">No. 0{i + 1}</span>
                    <h3>{VEHICLE_LABELS[v]}</h3>
                    <div className="pic">
                      <Car id={v} width={250} bodyTop={s.top} bodyBottom={s.bottom} hub={s.hub} />
                    </div>
                    <p>{VEHICLE_DESCRIPTIONS[v]}</p>
                    <Link href={`/quote?car=${v}`} className="go">
                      <span>Get this price</span>
                      <span className="text-gold">
                        <Arrow />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="band" aria-labelledby="band-title">
          <Image className="logo" src="/brand/logo-mark.png" alt="" width={710} height={512} />
          <div className="wrap">
            <div>
              <p className="eyebrow">Instant quote</p>
              <h2 id="band-title">
                One price.
                <br />
                <em>Calculated</em> in seconds.
              </h2>
              <p>
                Choose your airport, date and car. Your fixed fare appears instantly, and that is exactly what
                you pay. No meter, no surge, no surprises at the end of the journey.
              </p>
            </div>
            <div className="calc">
              <div className="row">
                <span>Pick-up</span>
                <b>Canary Wharf, E14</b>
              </div>
              <div className="row">
                <span>Destination</span>
                <b>Heathrow or Gatwick</b>
              </div>
              <div className="row">
                <span>Car</span>
                <b>Standard to Luxury</b>
              </div>
              <div className="lock">
                <Shield size={24} strokeWidth={1.5} />
                <div>Your all-in fare is calculated instantly and locked when you book.</div>
              </div>
              <Link href="#quote" className="btn btn-gold">
                Calculate my price <Arrow />
              </Link>
            </div>
          </div>
        </section>

        <section className="sec steps-s" id="how" aria-labelledby="how-title">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="eyebrow">How it works</p>
                <h2 className="h2" id="how-title">
                  Booked in under a minute.
                </h2>
              </div>
            </div>
            <ol className="steps">
              {HOW_IT_WORKS.map((s, i) => (
                <li className="step" key={s.step}>
                  <div className="n" aria-hidden="true">
                    {ROMAN[i]}
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="sec app" aria-labelledby="app-title">
          <div className="wrap">
            <div>
              <p className="eyebrow">Live tracking · coming with the Capital Lane app</p>
              <h2 className="h2" id="app-title">
                Watch your car arrive,
                <br />
                <em>to the minute.</em>
              </h2>
              <ul className="features">
                <li>
                  <Pin size={22} /> Live location of your chauffeur from 15 minutes before pickup
                </li>
                <li>
                  <Person size={22} /> Driver name, photo, car and number plate before you travel
                </li>
                <li>
                  <Phone size={22} /> Message your chauffeur or share your trip with family
                </li>
                <li>
                  <Card size={22} /> Receipts and invoices in one place
                </li>
              </ul>
              <div className="stores" aria-label="App coming soon">
                <div className="store">
                  Coming soon to the<b>App Store</b>
                </div>
                <div className="store">
                  Coming soon to<b>Google Play</b>
                </div>
              </div>
            </div>
            <div className="phones" aria-hidden="true">
              <div className="halo" />
              <div className="ph">
                <PhoneMock />
              </div>
            </div>
          </div>
        </section>

        <section className="sec reviews" id="reviews" aria-labelledby="reviews-title">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="eyebrow">Reviews</p>
                <h2 className="h2" id="reviews-title">
                  Trusted from
                  <br />
                  Canary Wharf.
                </h2>
              </div>
              <div>
                <span className="placeholder-tag">Sample scores</span>
                <div className="score" style={{ marginTop: 12 }}>
                  <div>
                    4.9<span>Google</span>
                  </div>
                  <div>
                    4.8<span>Trustpilot</span>
                  </div>
                </div>
              </div>
            </div>
            <ul className="grid3">
              {SAMPLE_REVIEWS.map((r) => (
                <li className="rev" key={r.name}>
                  <div className="stars" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <Star key={n} />
                    ))}
                  </div>
                  <blockquote>“{r.quote}”</blockquote>
                  <div className="who">
                    {r.name}
                    <span>{r.trip}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="note">
              Placeholder: sample reviews and scores for layout only. The live site will show real Google and
              Trustpilot reviews with counts.
            </p>
          </div>
        </section>

        <section className="cta" aria-labelledby="cta-title">
          <div className="wrap">
            <div className="logo-shine">
              <Image src="/brand/logo-full.png" alt={COMPANY.brandName} width={1111} height={724} />
            </div>
            <h2 id="cta-title">
              Your chauffeur is ready
              <br />
              when you are.
            </h2>
            <p>{SIGNATURE_LINE} Fixed, all-in fares to Heathrow and Gatwick, calculated in seconds.</p>
            <Link href="#quote" className="btn btn-gold">
              Calculate your price <Arrow />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

const LIVE_ROUTE = "M88,470 C100,420 150,400 160,350 C170,300 205,250 210,170 C212,140 215,110 230,90";

function PhoneMock() {
  const ui = "Inter, sans-serif";
  return (
    <svg viewBox="0 0 300 610" width="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <clipPath id="sca">
          <rect x="14" y="14" width="272" height="582" rx="34" />
        </clipPath>
        <filter id="sha" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity=".25" />
        </filter>
      </defs>
      <rect x="2" y="2" width="296" height="606" rx="46" fill="#0a0a0c" />
      <g clipPath="url(#sca)">
        <rect x="14" y="14" width="272" height="582" fill="#1a1a1a" />
        <rect x="30" y="300" width="90" height="70" rx="8" fill="#202020" />
        <rect x="190" y="120" width="80" height="60" rx="8" fill="#202020" />
        <path
          d="M-10,250 C60,220 120,300 180,270 C240,240 270,300 320,280 L320,330 C260,350 240,290 180,320 C120,350 60,270 -10,300 Z"
          fill="#111"
        />
        <g stroke="#2b2b2b" strokeWidth="9" fill="none" strokeLinecap="round">
          <path d="M14,110 L286,150" />
          <path d="M60,14 L110,596" />
          <path d="M14,420 L286,390" />
          <path d="M220,14 L200,596" />
          <path d="M14,520 L286,540" />
        </g>
        <g stroke="#2b2b2b" strokeWidth="4" fill="none">
          <path d="M14,190 L286,210" />
          <path d="M150,14 L160,596" />
          <path d="M14,350 L286,340" />
        </g>
        <path d={LIVE_ROUTE} stroke="#D4B06A" strokeOpacity=".35" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path className="live-trail" d={LIVE_ROUTE} pathLength={100} stroke="#D4B06A" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle className="live-pin-pulse" cx="230" cy="90" r="11" fill="none" stroke="#D4B06A" strokeWidth="2" />
        <circle cx="230" cy="90" r="11" fill="#D4B06A" />
        <circle cx="230" cy="90" r="4" fill="#0a0a0c" />
        {/* Live location: the chauffeur's dot drives the route (glow.css), parked mid-route without motion */}
        <g className="live-car" style={{ offsetPath: `path("${LIVE_ROUTE}")` }}>
          <circle className="live-car-halo" r="22" fill="#D4B06A" opacity=".25" />
          <circle r="11" fill="#D4B06A" stroke="#fff" strokeWidth="3" />
        </g>
        <rect x="30" y="40" width="240" height="44" rx="14" fill="#161616" filter="url(#sha)" />
        <text x="48" y="58" fontFamily={ui} fontSize="10" fill="#9a9a9a">
          Arriving in
        </text>
        <text x="48" y="75" fontFamily={ui} fontSize="15" fontWeight="700" fill="#f2efea">
          6 min · Heathrow T5
        </text>
        <rect x="24" y="452" width="252" height="132" rx="22" fill="#161616" filter="url(#sha)" />
        <circle cx="56" cy="490" r="18" fill="#D4B06A" opacity=".9" />
        <text x="56" y="495" textAnchor="middle" fontFamily={ui} fontSize="13" fontWeight="700" fill="#0a0a0c">
          JA
        </text>
        <text x="84" y="486" fontFamily={ui} fontSize="14" fontWeight="700" fill="#f2efea">
          James, your chauffeur
        </text>
        <text x="84" y="503" fontFamily={ui} fontSize="11" fill="#9a9a9a">
          Executive · Black saloon · LN26 CLX
        </text>
        <rect x="40" y="524" width="104" height="38" rx="12" fill="#D4B06A" />
        <text x="92" y="548" textAnchor="middle" fontFamily={ui} fontSize="12" fontWeight="700" fill="#0a0a0c">
          Message
        </text>
        <rect x="154" y="524" width="104" height="38" rx="12" fill="none" stroke="#9a9a9a" strokeOpacity=".5" />
        <text x="206" y="548" textAnchor="middle" fontFamily={ui} fontSize="12" fontWeight="600" fill="#f2efea">
          Share trip
        </text>
      </g>
      <rect x="115" y="22" width="70" height="20" rx="10" fill="#0a0a0c" />
    </svg>
  );
}
